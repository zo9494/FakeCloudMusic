import NCM from 'NeteaseCloudMusicApi';

export function API(url: string, params: any): Promise<any> {
  params.realIP = '116.25.146.179';
  const { cookie, ...args } = params;
  console.log(url, args);
  return NCM[url]({ ...params });
}
