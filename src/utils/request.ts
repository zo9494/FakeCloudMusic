interface Res {
  status: number;
  body: any;
  error?: any;
}

export class Service {
  public async get<T = undefined>(url: string, config?: any): Promise<T> {
    console.log(url, url.replaceAll('/', '_').slice(1));
    return window.electron.ipcRenderer
      .invoke<Res>('HTTP', {
        url: url.replaceAll('/', '_').slice(1),
        params: { ...config?.params, cookie: localStorage.cookie },
      })
      .then<T>(res => {
        console.log('API:', url, res);
        if (res.error) {
          window.$message.warning(res.error, {
            closable: true,
            duration: 0,
          });
          throw new Error(res.error);
        }
        return res?.body;
      });
  }
}

export const service = new Service();
