import { app } from 'electron';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
import * as path from 'path';

// 配置常量
const CACHE_DIR = path.join(app.getPath('userData'), 'audio-cache');

// 初始化缓存目录
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export class CacheManager {
  private static instance: CacheManager;
  private maxCacheSize: number = 1024 * 1024 * 1024; // 1GB 默认最大缓存大小

  /**
   * 获取最大缓存大小限制（字节）
   */
  getMaxCacheSize(): number {
    return this.maxCacheSize;
  }

  /**
   * 设置最大缓存大小限制（字节）
   */
  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  getCachePath(url: URL): string {
    const value = `${url.host}/${url.searchParams.get('id')}`;
    const hash = require('crypto')
      .createHash('md5')
      .update(value)
      .digest('hex');
    return path.join(CACHE_DIR, `${hash}.mp3`);
  }

  async isFullyCached(url: URL): Promise<boolean> {
    const cachePath = this.getCachePath(url);
    try {
      await fsp.access(cachePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fsp.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * 获取缓存目录总大小
   */
  async getCacheSize(): Promise<number> {
    try {
      const files = await fsp.readdir(CACHE_DIR);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fsp.stat(filePath);
        totalSize += stats.size;
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  /**
   * 清理过期缓存文件以保持在最大缓存限制内
   */
  async enforceCacheLimit(): Promise<void> {
    try {
      const cacheSize = await this.getCacheSize();

      // 如果缓存大小在限制内，则无需清理
      if (cacheSize <= this.maxCacheSize) {
        return;
      }

      // 获取所有缓存文件及其信息
      const files = await fsp.readdir(CACHE_DIR);
      const fileStats: { name: string; size: number; mtime: Date }[] = [];

      for (const file of files) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fsp.stat(filePath);
        fileStats.push({
          name: file,
          size: stats.size,
          mtime: stats.mtime,
        });
      }

      // 按修改时间排序（最旧的在前）
      fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

      // 删除最旧的文件，直到缓存大小在限制内
      let currentSize = cacheSize;
      for (const fileStat of fileStats) {
        if (currentSize <= this.maxCacheSize) {
          break;
        }

        const filePath = path.join(CACHE_DIR, fileStat.name);
        try {
          await fsp.unlink(filePath);
          currentSize -= fileStat.size;
          console.log(`Removed cache file: ${fileStat.name}`);
        } catch (error) {
          console.error(`Error removing cache file ${fileStat.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error enforcing cache limit:', error);
    }
  }

  /**
   * 清空所有缓存
   */
  async clearCache(): Promise<void> {
    try {
      const files = await fsp.readdir(CACHE_DIR);
      for (const file of files) {
        const filePath = path.join(CACHE_DIR, file);
        await fsp.unlink(filePath);
      }
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * 删除特定URL的缓存
   */
  async removeCacheForUrl(url: URL): Promise<void> {
    try {
      const cachePath = this.getCachePath(url);
      await fsp.unlink(cachePath);
      console.log(`Removed cache for URL: ${url.toString()}`);
    } catch (error) {
      // 文件可能不存在，这是正常情况
      console.debug(`No cache file to remove for URL: ${url.toString()}`);
    }
  }
}

export const cacheManager = CacheManager.getInstance();
