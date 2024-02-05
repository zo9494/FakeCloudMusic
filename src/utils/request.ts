interface Res {
  status: number;
  body: any;
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
        console.log('request:', res);
        if (res) {
          return res.body;
        } else {
        }
      });
  }
}

export const service = new Service();
