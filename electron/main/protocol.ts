import { app, protocol } from 'electron';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
import * as path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import { Readable, PassThrough } from 'stream';
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
    const value = `${url.host}/${url.searchParams.get('id')}`;
    const hash = require('crypto')
      .createHash('md5')
      .update(value)
      .digest('hex');
    return path.join(CACHE_DIR, `${hash}.mp3`);
  }

  static async isFullyCached(url: URL): Promise<boolean> {
    const cachePath = this.getCachePath(url);
    try {
      await fsp.access(cachePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  static async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fsp.stat(filePath);
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
    range?: { start: number; end?: number }
  ): Promise<AudioStreamResult> {
    const cachePath = CacheManager.getCachePath(url);
    const tempPath = `${cachePath}.tmp`;

    // 如果是范围请求且文件已完全缓存，直接从缓存文件读取
    if (range && (await CacheManager.isFullyCached(url))) {
      return this.createStreamFromCache(cachePath, range);
    }

    return this.createStreamFromNetwork(url, range, cachePath, tempPath);
  }

  private static createStreamFromCache(
    cachePath: string,
    range: { start: number; end?: number }
  ): AudioStreamResult {
    const readStream = createReadStream(cachePath, {
      start: range.start,
      end: range.end,
    });

    const totalSize = fs.statSync(cachePath).size; // 单次同步读取元数据，代价低
    const effectiveEnd = (range.end ?? (totalSize - 1));
    const contentLength = effectiveEnd - range.start + 1;
    const contentRange = RangeRequestHandler.createContentRangeHeader(
      { start: range.start, end: effectiveEnd },
      totalSize
    );

    return {
      stream: Readable.toWeb(readStream) as unknown as ReadableStream<Uint8Array>,
      contentLength,
      contentRange,
      totalSize,
    };
  }

  private static createStreamFromNetwork(
    url: URL,
    range: { start: number; end?: number } | undefined,
    cachePath: string,
    tempPath: string
  ): Promise<AudioStreamResult> {
    return new Promise((resolve, reject) => {
      const passThrough = new PassThrough();

      // 确保临时文件存在
      const ensureTemp = async () => {
        try {
          await fsp.mkdir(path.dirname(tempPath), { recursive: true });
          await fsp.access(tempPath, fs.constants.F_OK).catch(async () => {
            await fsp.writeFile(tempPath, Buffer.alloc(0));
          });
        } catch (e) {
          // 忽略创建临时文件失败，后续写入会报错
        }
      };
      ensureTemp();

      // 根据是否有范围请求决定写入模式
      const writeStream = range
        ? createWriteStream(tempPath, { flags: 'r+', start: range.start })
        : createWriteStream(tempPath, { flags: 'w' });

      mediaSourceResolver
        .resolve(url.searchParams.get('id'), url.searchParams.get('cookie'))
        .then(realUrl => {
          const request = net.request(realUrl);

          // 如果是范围请求，设置请求头
          if (range) {
            const endPart = typeof range.end === 'number' ? range.end : '';
            request.setHeader('Range', `bytes=${range.start}-${endPart}`);
          }

          let totalSize = 0;
          let isCompleteDownloadFlag = false;
          let upstreamContentRange: string | undefined;

          request.on('response', response => {
            const contentLengthHeader = response.headers['content-length'];
            const contentRangeHeader = response.headers['content-range'];
            if (Array.isArray(contentRangeHeader)) {
              upstreamContentRange = contentRangeHeader[0] as string;
            } else if (typeof contentRangeHeader === 'string') {
              upstreamContentRange = contentRangeHeader as string;
            }
            if (contentLengthHeader) {
              const len = Array.isArray(contentLengthHeader)
                ? parseInt(contentLengthHeader[0] as string)
                : parseInt(contentLengthHeader as string);
              if (!Number.isNaN(len)) totalSize = len;
            }

            // 检查是否是完整下载
            if (!range) {
              isCompleteDownloadFlag = true;
            } else if (upstreamContentRange) {
              // bytes a-b/total
              const m = upstreamContentRange.match(/bytes\s+(\d+)-(\d+)\/(\d+)/);
              if (m) {
                const b = parseInt(m[2], 10);
                const t = parseInt(m[3], 10);
                totalSize = t || totalSize;
                isCompleteDownloadFlag = range.start === 0 && b === t - 1;
              }
            }

            // 将上游数据写入内存与磁盘（避免类型问题，不直接使用 pipe）
            response.on('data', (chunk: Buffer) => {
              passThrough.write(chunk);
              writeStream.write(chunk);
            });
            response.on('error', err => {
              passThrough.destroy(err);
              writeStream.destroy(err as any);
              reject(err);
            });

            response.on('end', () => {
              passThrough.end();
              writeStream.end();
              // 如果是完整下载，重命名临时文件
              (async () => {
                try {
                  if (isCompleteDownloadFlag) {
                    await fsp.rename(tempPath, cachePath).catch(() => {});
                    console.log('Audio fully downloaded and cached successfully.');
                  }
                } catch (renameError) {
                  console.error('Error renaming temp file:', renameError);
                }
              })();
            });

            const lengthFromRange = (() => {
              if (!upstreamContentRange) return undefined;
              const m = upstreamContentRange.match(/bytes\s+(\d+)-(\d+)\/(\d+)/);
              if (!m) return undefined;
              const s = parseInt(m[1], 10);
              const e = parseInt(m[2], 10);
              return e - s + 1;
            })();

            // 计算内容长度和范围（尽量透传上游）
            const contentLength = lengthFromRange ?? totalSize;
            const contentRange = upstreamContentRange;

            resolve({
              stream: Readable.toWeb(passThrough) as unknown as ReadableStream<Uint8Array>,
              contentLength,
              contentRange,
              totalSize: totalSize || undefined,
            });
          });

          request.on('error', err => {
            console.error('Request error:', err);
            reject(err);
          });

          request.end();
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
    if (await CacheManager.isFullyCached(url)) {
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
    const totalSize = await CacheManager.getFileSize(CacheManager.getCachePath(url));
    const range = RangeRequestHandler.parseRangeHeader(rangeHeader, totalSize);

    if (!range) {
      return ResponseBuilder.createRangeNotSatisfiableResponse();
    }

    const readStream = createReadStream(CacheManager.getCachePath(url), {
      start: range.start,
      end: range.end,
    });


    return ResponseBuilder.createRangeResponse(
      Readable.toWeb(readStream) as unknown as ReadableStream<Uint8Array>,
      RangeRequestHandler.createContentRangeHeader(range, totalSize),
      range.end - range.start + 1
    );
  }

  private static async handleUncachedRangeRequest(
    url: URL,
    rangeHeader: string
  ): Promise<Response> {
    // 直接解析 Range 起始位置（不依赖总大小），透传给上游
    const match = rangeHeader.match(/bytes=(\d+)-(?:(\d+))?/);
    if (!match) {
      return ResponseBuilder.createRangeNotSatisfiableResponse();
    }
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : undefined;

    const { stream, contentLength, contentRange } =
      await AudioStreamHandler.createAudioStreamWithRange(url, { start, end });

    return ResponseBuilder.createRangeResponse(
      stream,
      contentRange || `bytes ${start}-${end ?? ''}/*`,
      contentLength
    );
  }

  private static async handleFullRequest(url: URL): Promise<Response> {
    // 检查是否已完全缓存（非范围请求）
    if (await CacheManager.isFullyCached(url)) {
      const fileStream = createReadStream(CacheManager.getCachePath(url));
      return ResponseBuilder.createSuccessResponse(
        Readable.toWeb(fileStream) as unknown as ReadableStream<Uint8Array>,
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
