interface Res {
  status: number;
  body: any;
}

export class Service {
  private isShowedNetErr = false;
  protected isOnline = true;
  constructor() {
    this.init();
  }
  private init() {
    this.bindEvent();
    this.checkInternetConnection();
  }
  private bindEvent() {
    window.addEventListener('online', this.checkInternetConnection);
    window.addEventListener('offline', this.checkInternetConnection);
  }
  public async get<T = undefined>(
    url: string,
    config?: any,
    // 重试3次
    retries = 3
  ): Promise<T | undefined> {
    if (!this.isOnline) {
      console.log('API: %s, 网络已断开！', url);
      return;
    }
    const res = await window.electron.ipcRenderer.invoke<Res>('HTTP', {
      url: url.replaceAll('/', '_').slice(1),
      params: { ...config?.params, cookie: localStorage.cookie },
    });
    console.log('retries: %d; API: %s %o', retries, url, res);

    if (retries <= 0) {
      console.error(
        `请求失败 %s 失败,code:  %d,msg:  %s`,
        url,
        res.status,
        res.body.msg
      );
      return;
    }
    // 请求成功
    if (res.status >= 200 && res.status < 300) {
      return res.body;
    }
    // 服务器错误
    if (res.status >= 500 && res.status < 600) {
      console.log('服务器错误，2秒后重试，还剩 %d 次', retries);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.get(url, config, retries - 1);
    }
  }

  async checkInternetConnection() {
    const isOnline = await window.electron.ipcRenderer.invoke<boolean>(
      'APP:NET_STATUS'
    );
    this.isOnline = isOnline;
    if (!isOnline && !this.isShowedNetErr) {
      window.$message.error('网络已断开!', {
        duration: 0,
        onClose: () => {
          this.isShowedNetErr = false;
        },
        closable: true,
      });
      this.isShowedNetErr = true;
    }
  }
}

export const service = new Service();
