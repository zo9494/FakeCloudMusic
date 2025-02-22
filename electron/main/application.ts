import { BrowserWindow, nativeTheme, Tray } from 'electron';
import { Thumbar } from './thumbar.service';

export interface Application {
  win?: BrowserWindow;
  tray?: Tray;
  thumbar?: Thumbar;
  downloadFileName: string;
}

export const SYSTEM_IS_DARK_MODE = nativeTheme.shouldUseDarkColors;
export const application: Application = {
  downloadFileName: 'unknown',
};
