import { BrowserWindow, Tray } from 'electron';
import { Thumbar } from './thumbar.service';

export class Application {
  public win: BrowserWindow;
  public tray: Tray;
  public thumbar: Thumbar;
  public downloadFileName: string = 'unknown';
}
export const application = new Application();
