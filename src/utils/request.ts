import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

type Result<T, D> = T & {
  code: number;
  data: D;
};

type RequestConfig = Omit<AxiosRequestConfig, 'headers'> & {
  headers?: any;
};
export class Service {
  instance: AxiosInstance;

  constructor(config?: RequestConfig) {
    this.instance = axios.create({
      baseURL: 'http://localhost:35011',
      timeout: 1000 * 10,
      ...config,
    });
    this.instance.interceptors.request.use(config => {
      config.params = {
        ...config.params,
        cookie: localStorage.cookie,
      };
      return config;
    });
  }

  public request(config: RequestConfig): Promise<AxiosResponse> {
    return this.instance.request(config);
  }
  public async get<T = undefined>(
    url: string,
    config?: RequestConfig
  ): Promise<T | null> {
    const res = await this.instance.get(url, config);
    return res.data;
  }
}

export const service = new Service();
