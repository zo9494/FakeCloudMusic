import { BrowserWindow, Tray } from 'electron';
import { Thumbar } from './thumbar.service';

export interface Application {
  win?: BrowserWindow;
  tray?: Tray;
  thumbar?: Thumbar;
  downloadFileName: string;
}
export const application: Application = {
  downloadFileName: 'unknown',
};
