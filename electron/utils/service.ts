import NCM from 'NeteaseCloudMusicApi';

export function API(url: string, params: any): Promise<any> {
  // params.realIP = '116.25.146.179';
  params.noCookie = true;
  const { cookie, ...args } = params;
  return NCM[url]({ ...params });
}
