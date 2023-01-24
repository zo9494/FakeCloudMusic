import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

type Result<T> = {
  code: number;
  data: T;
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
  }

  public request(config: RequestConfig): Promise<AxiosResponse> {
    return this.instance.request(config);
  }
  public get<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<AxiosResponse<Result<T>>> {
    return this.instance.get(url, config);
  }
}

export const service = new Service();
