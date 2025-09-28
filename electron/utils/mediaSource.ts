import { net } from 'electron';
import { getSongUrl, getUnBlockSong } from './service';

// 媒体源解析器

class MediaSourceResolver {
  async resolve(id: string, cookie?: string): Promise<string | null> {
    return (
      (await this.fromNetEase(id, cookie)) ||
      (await this.fromUnblock(id)) ||
      null
    );
  }

  private async fromNetEase(id: string, cookie): Promise<string | null> {
    const res = await getSongUrl(id, cookie);

    if (res.freeTrialInfo) {
      console.info(`歌曲 ${id} 为试听版本`);
      return null;
    }
    return res.url || null;
  }

  private async fromUnblock(id: string): Promise<string | null> {
    const result = await net
      .fetch(
        `https://music-api.gdstudio.xyz/api.php?types=url&source=netease&id=${id}&br=320`
      )
      .then(res => res.json());
    console.info('unblock result:', result);
    return result?.url || null;
  }
}

export const mediaSourceResolver = new MediaSourceResolver();
