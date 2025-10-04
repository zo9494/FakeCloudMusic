import NCM, { song_url, song_url_v1 } from 'NeteaseCloudMusicApi';
import match from '@unblockneteasemusic/server';
import { net } from 'electron';
export async function API(url: string, params: any): Promise<any> {
  try {
    // params.realIP = '116.25.146.179';
    params.noCookie = true;
    params.timeout = 5000;
    const { cookie, ...args } = params;
    return await NCM[url]({ ...params });
  } catch (error) {
    return { ...error };
  }
}

export async function UnblockAPI(id: number, params: any): Promise<any> {
  try {
    return await match(id, params);
  } catch (error) {
    return { ...error };
  }
}

interface SongUrl {
  url: string | null;
  time: number;
  id: number;
  size: number;
  level: 'standard' | 'higher' | 'exhigh' | 'lossless' | 'hires';
  freeTrialInfo: any;
}
type Id = number | string;
type Ids = string[] | number[];
export function getSongUrl(id: Id, cookie?: string): Promise<SongUrl>;
export function getSongUrl(ids: Ids, cookie?: string): Promise<SongUrl[]>;
export async function getSongUrl(ids, cookie) {
  const isArray = Array.isArray(ids);
  try {
    const { body } = await song_url({
      id: isArray ? ids.join(',') : ids,
      cookie,
    });
    const res = body as unknown as { data: SongUrl[] };
    console.info('netease result:', res);

    if (!res?.data) {
      return null;
    }
    if (isArray) {
      return res.data;
    }
    return res.data[0];
  } catch (error) {
    console.error('netease Error:', error);

    return null;
  }
}

interface UnblockResult {
  id: string;
  url: string | null;
}
export async function getUnBlockSong(id: Id): Promise<UnblockResult | null> {
  try {
    const result = await match({
      id: id,
      params: ['pyncmd'],
    });
    console.info('unblock result:', result);
    return result;
  } catch (error) {
    console.error('fromUnblock Error:', error);
    return null;
  }
}

class NetHelper {
  protected isOnline: boolean;
  constructor() {
    // this.checkInternetConnection();
  }
  async checkInternetConnection(
    urls: Array<string> = [
      'https://music.163.com',
      'https://interface.music.163.com',
      'https://www.baidu.com',
    ],
    timeout = 4000
  ) {
    for (const url of urls) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort, timeout);
      try {
        const response = await net.fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
        });
        console.log('response.status:', response.status);
        this.isOnline = true;
        return true;
      } catch (error) {
        console.log(error);

        clearTimeout(timer);
        this.isOnline = false;
        return false;
      }
    }
  }
}

export const netHelper = new NetHelper();
