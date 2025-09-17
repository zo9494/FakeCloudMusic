import NCM from 'NeteaseCloudMusicApi';
import match from '@unblockneteasemusic/server';
export async function API(url: string, params: any): Promise<any> {
  try {
    // params.realIP = '116.25.146.179';
    params.noCookie = true;
    params.timeout = 6000;
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
