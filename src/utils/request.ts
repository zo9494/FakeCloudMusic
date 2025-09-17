interface Res {
  status: number;
  body: any;
}

export class Service {
  public async get<T = undefined>(
    url: string,
    config?: any,
    // 重试3次
    retries = 3
  ): Promise<T> {
    console.log('API: %s', url);
    const res = await window.electron.ipcRenderer.invoke<Res>('HTTP', {
      url: url.replaceAll('/', '_').slice(1),
      params: { ...config?.params, cookie: localStorage.cookie },
    });
    if (retries <= 0) {
      console.error(
        `请求失败 %s 失败,code:  %d,msg:  %s`,
        url,
        res.status,
        res.body.msg
      );
      return res.body;
    }
    // 请求成功
    // if (res.status >= 200 && res.status < 300) {
    //   return res.body;
    // }
    // 服务器错误
    if (res.status >= 500 && res.status < 600) {
      console.log('服务器错误，2秒后重试，还剩 %d 次', retries);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.get(url, config, retries - 1);
      // window.$message.warning('api错误:' + url, {
      //   closable: true,
      //   duration: 0,
      // });
    }
    // 其它
    return res.body;
  }
}

export const service = new Service();
