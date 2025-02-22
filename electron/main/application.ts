import { BrowserWindow, nativeTheme, Tray } from 'electron';
import { Thumbar } from './thumbar.service';

export interface Application {
  win?: BrowserWindow;
  tray?: Tray;
  thumbar?: Thumbar;
  downloadFileName: string;
  systemUseDarkMode: boolean;
}
export const application: Application = {
  downloadFileName: 'unknown',
  systemUseDarkMode: nativeTheme.shouldUseDarkColors,
};
