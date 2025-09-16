import { BrowserWindow, nativeTheme } from 'electron';
import { Thumbar } from './thumbar.service';
import { AppTray } from './tray';

export interface Application {
  win?: BrowserWindow;
  tray?: AppTray;
  thumbar?: Thumbar;
  downloadFileName: string;
}

export const SYSTEM_IS_DARK_MODE = nativeTheme.shouldUseDarkColors;
export const application: Application = {
  downloadFileName: 'unknown',
};
