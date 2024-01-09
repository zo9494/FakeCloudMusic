interface Res {
  status: number;
  body: any;
}

export class Service {
  public async get<T = undefined>(
    url: string,
    config?: any
  ): Promise<T | null> {
    return window.electron.ipcRenderer
      .invoke<Res>('HTTP', {
        url: url.replaceAll('/', '_').slice(1),
        params: { ...config?.params, cookie: localStorage.cookie },
      })
      .then<T>(res => {
        console.log(url.replaceAll('/', '_').slice(1), res);
        return res.body;
      });
  }
}

export const service = new Service();
