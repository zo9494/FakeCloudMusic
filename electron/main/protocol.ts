import { app, protocol } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import { Readable } from 'stream';
import { net } from 'electron';
import { mediaSourceResolver } from '../utils/mediaSource';

// 配置常量
const CACHE_DIR = path.join(app.getPath('userData'), 'audio-cache');
const SCHEME_NAME = 'fcm-app';

// 初始化缓存目录
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// 注册协议
protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME_NAME,
    privileges: {
      secure: true,
      supportFetchAPI: true,
      standard: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

/**
 * 缓存管理器
 */
class CacheManager {
  static getCachePath(url: URL): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(url.href)
      .digest('hex');
    return path.join(CACHE_DIR, `${hash}.mp3`);
  }

  static isFullyCached(url: URL): boolean {
    const cachePath = this.getCachePath(url);
    return fs.existsSync(cachePath);
  }

  static getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  static clearCache(): void {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      });
    }
  }
}

/**
 * 范围请求处理器
 */
class RangeRequestHandler {
  static parseRangeHeader(
    rangeHeader: string | null,
    totalSize: number
  ): { start: number; end: number } | null {
    if (!rangeHeader) return null;

    const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
    if (!match) return null;

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

    return { start, end: Math.min(end, totalSize - 1) };
  }

  static isCompleteDownload(
    range: { start: number; end: number } | undefined,
    totalSize: number
  ): boolean {
    if (!range) return true;
    return range.start === 0 && range.end === totalSize - 1;
  }

  static createContentRangeHeader(
    range: { start: number; end: number },
    totalSize: number
  ): string {
    return `bytes ${range.start}-${range.end}/${totalSize}`;
  }
}

/**
 * 音频流处理器
 */
class AudioStreamHandler {
  static async createAudioStreamWithRange(
    url: URL,
    range?: { start: number; end: number }
  ): Promise<AudioStreamResult> {
    const cachePath = CacheManager.getCachePath(url);
    const tempPath = `${cachePath}.tmp`;

    // 如果是范围请求且文件已完全缓存，直接从缓存文件读取
    if (range && CacheManager.isFullyCached(url)) {
      return this.createStreamFromCache(cachePath, range);
    }

    return this.createStreamFromNetwork(url, range, cachePath, tempPath);
  }

  private static createStreamFromCache(
    cachePath: string,
    range: { start: number; end: number }
  ): AudioStreamResult {
    const readStream = createReadStream(cachePath, {
      start: range.start,
      end: range.end,
    });

    const totalSize = CacheManager.getFileSize(cachePath);
    const contentLength = range.end - range.start + 1;
    const contentRange = RangeRequestHandler.createContentRangeHeader(
      range,
      totalSize
    );

    return {
      stream: readStream as unknown as ReadableStream<Uint8Array>,
      contentLength,
      contentRange,
      totalSize,
    };
  }

  private static createStreamFromNetwork(
    url: URL,
    range: { start: number; end: number } | undefined,
    cachePath: string,
    tempPath: string
  ): Promise<AudioStreamResult> {
    return new Promise((resolve, reject) => {
      const readable = new Readable({
        read() {},
      });

      // 确保临时文件存在
      if (!fs.existsSync(tempPath)) {
        fs.writeFileSync(tempPath, Buffer.alloc(0));
      }

      // 根据是否有范围请求决定写入模式
      const writeStream = range
        ? createWriteStream(tempPath, { flags: 'r+', start: range.start })
        : createWriteStream(tempPath, { flags: 'w' });

      mediaSourceResolver
        .resolve(url.searchParams.get('id'))
        .then(neteaseUrl => {
          console.log('neteaseUrl:', neteaseUrl);

          const request = net.request(neteaseUrl);

          // 如果是范围请求，设置请求头
          if (range) {
            request.setHeader('Range', `bytes=${range.start}-${range.end}`);
          }

          let totalSize = 0;
          let downloadedSize = 0;
          let isCompleteDownloadFlag = false;

          request.on('response', response => {
            // 获取总大小
            const contentLengthHeader = response.headers['content-length'];
            if (contentLengthHeader) {
              totalSize = parseInt(contentLengthHeader as string);
            }

            // 检查是否是完整下载
            isCompleteDownloadFlag =
              !range ||
              (range.start === 0 && range.end >= (totalSize - 1 || Infinity));

            response.on('data', (chunk: Buffer) => {
              // 将数据推送到流中
              readable.push(chunk);

              // 同时写入临时文件进行缓存
              writeStream.write(chunk);
              downloadedSize += chunk.length;
            });

            response.on('end', () => {
              readable.push(null);
              writeStream.end(() => {
                // 如果是完整下载，重命名临时文件
                if (isCompleteDownloadFlag) {
                  try {
                    fs.renameSync(tempPath, cachePath);
                    console.log(
                      'Audio fully downloaded and cached successfully.'
                    );
                  } catch (renameError) {
                    console.error('Error renaming temp file:', renameError);
                  }
                } else {
                  console.log(
                    'Audio partial download completed, kept in temp file.'
                  );
                }
              });
            });

            response.on('error', err => {
              console.error('Response stream error:', err);
              readable.destroy(err);
              writeStream.destroy();
              reject(err);
            });
          });

          request.on('error', err => {
            console.error('Request error:', err);
            readable.destroy(err);
            reject(err);
          });

          request.end();

          // 计算内容长度和范围
          let contentLength = totalSize;
          let contentRange = undefined;

          if (range) {
            contentLength = range.end - range.start + 1;
            contentRange = RangeRequestHandler.createContentRangeHeader(
              range,
              totalSize
            );
          }

          resolve({
            stream: readable as unknown as ReadableStream<Uint8Array>,
            contentLength,
            contentRange,
            totalSize: totalSize || undefined,
          });
        })
        .catch(reject);
    });
  }
}

/**
 * 响应构建器
 */
class ResponseBuilder {
  static createSuccessResponse(
    stream: ReadableStream<Uint8Array>,
    headers: Record<string, string>
  ): Response {
    return new Response(stream, {
      headers: new Headers(headers),
    });
  }

  static createRangeResponse(
    stream: ReadableStream<Uint8Array>,
    contentRange: string,
    contentLength: number
  ): Response {
    return new Response(stream, {
      status: 206, // Partial Content
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Range': contentRange,
        'Content-Length': contentLength.toString(),
        'Accept-Ranges': 'bytes',
      },
    });
  }

  static createErrorResponse(message: string, status: number = 500): Response {
    return new Response(message, { status });
  }

  static createNotFoundResponse(): Response {
    return this.createErrorResponse('Not Found', 404);
  }

  static createRangeNotSatisfiableResponse(): Response {
    return this.createErrorResponse('Range Not Satisfiable', 416);
  }
}

/**
 * 协议处理器
 */
class ProtocolHandler {
  private static readonly MEDIA_HOST = 'media';

  static async handle(request: Request): Promise<Response> {
    const urlObj = new URL(request.url);

    switch (urlObj.host) {
      case ProtocolHandler.MEDIA_HOST:
        return await ProtocolHandler.handleMediaProtocol(request, urlObj);
      default:
        return ResponseBuilder.createNotFoundResponse();
    }
  }

  private static async handleMediaProtocol(
    request: Request,
    url: URL
  ): Promise<Response> {
    try {
      const rangeHeader = request.headers.get('range');

      if (rangeHeader) {
        return await ProtocolHandler.handleRangeRequest(
          request,
          url,
          rangeHeader
        );
      }

      return await ProtocolHandler.handleFullRequest(url);
    } catch (error) {
      console.error('Error handling cached-audio protocol:', error);
      return ResponseBuilder.createErrorResponse('Internal Server Error', 500);
    }
  }

  private static async handleRangeRequest(
    request: Request,
    url: URL,
    rangeHeader: string
  ): Promise<Response> {
    // 检查是否已完全缓存
    if (CacheManager.isFullyCached(url)) {
      console.log('file is cached get from cache');
      return await ProtocolHandler.handleCachedRangeRequest(url, rangeHeader);
    } else {
      console.log('file is not cached get from net');
      return await ProtocolHandler.handleUncachedRangeRequest(url, rangeHeader);
    }
  }

  private static async handleCachedRangeRequest(
    url: URL,
    rangeHeader: string
  ): Promise<Response> {
    const totalSize = CacheManager.getFileSize(CacheManager.getCachePath(url));
    const range = RangeRequestHandler.parseRangeHeader(rangeHeader, totalSize);

    if (!range) {
      return ResponseBuilder.createRangeNotSatisfiableResponse();
    }

    const readStream = createReadStream(CacheManager.getCachePath(url), {
      start: range.start,
      end: range.end,
    });

    return ResponseBuilder.createRangeResponse(
      readStream as unknown as ReadableStream<Uint8Array>,
      RangeRequestHandler.createContentRangeHeader(range, totalSize),
      range.end - range.start + 1
    );
  }

  private static async handleUncachedRangeRequest(
    url: URL,
    rangeHeader: string
  ): Promise<Response> {
    return new Promise(async (resolve, reject) => {
      try {
        const neteaseUrl = await mediaSourceResolver.resolve(
          url.searchParams.get('id')
        );

        // 创建一个临时请求来获取大小
        const sizeRequest = net.request({
          method: 'HEAD',
          url: neteaseUrl,
        });

        sizeRequest.on('response', response => {
          const contentLength = response.headers['content-length'];
          const totalSize = contentLength
            ? parseInt(contentLength as string)
            : 0;

          // 解析范围请求
          const range = RangeRequestHandler.parseRangeHeader(
            rangeHeader,
            totalSize
          );

          if (!range) {
            resolve(ResponseBuilder.createRangeNotSatisfiableResponse());
            return;
          }

          // 创建带范围的音频流
          AudioStreamHandler.createAudioStreamWithRange(url, range)
            .then(({ stream, contentLength, contentRange }) => {
              resolve(
                ResponseBuilder.createRangeResponse(
                  stream,
                  contentRange!,
                  contentLength
                )
              );
            })
            .catch(reject);
        });

        sizeRequest.on('error', reject);
        sizeRequest.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static async handleFullRequest(url: URL): Promise<Response> {
    // 检查是否已完全缓存（非范围请求）
    if (CacheManager.isFullyCached(url)) {
      const fileStream = createReadStream(CacheManager.getCachePath(url));
      return ResponseBuilder.createSuccessResponse(
        fileStream as unknown as ReadableStream<Uint8Array>,
        {
          'Content-Type': 'audio/mpeg',
          'Accept-Ranges': 'bytes',
        }
      );
    }

    // 文件未缓存，创建流式响应（完整下载）
    const { stream, contentLength } =
      await AudioStreamHandler.createAudioStreamWithRange(url);

    const responseHeaders: Record<string, string> = {
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
    };

    if (contentLength > 0) {
      responseHeaders['Content-Length'] = contentLength.toString();
    }

    return ResponseBuilder.createSuccessResponse(stream, responseHeaders);
  }
}

// 类型定义
interface AudioStreamResult {
  stream: ReadableStream<Uint8Array>;
  contentLength: number;
  contentRange?: string;
  totalSize?: number;
}

// 导出函数
export function registerProtocol(): void {
  console.log('registerAudioProtocol');
  protocol.handle(SCHEME_NAME, ProtocolHandler.handle);
}

export function unregisterProtocol(): void {
  protocol.unhandle(SCHEME_NAME);
}

// 便捷的缓存清理函数
export function clearCache(): void {
  CacheManager.clearCache();
}
