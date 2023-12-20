import { BrowserWindow, ipcMain } from 'electron';
import { customWindowHeaderBar } from '../utils/platform';
import { join } from 'node:path';
import { EVENT } from '../utils/eventTypes';
import { PAGE_LOGIN } from '../../const';
const url = process.env.VITE_DEV_SERVER_URL;
const preloadLogin = join(__dirname, '../preload/login.js');
const loginHtml = join(process.env.DIST, PAGE_LOGIN);

export class Login {
  win: BrowserWindow | null = null;
  constructor(options) {
    this.createWindow(options);
  }
  async createWindow({ parent }) {
    if (this.win) {
      this.win.focus();
      return;
    }

    this.win = new BrowserWindow({
      width: 320,
      height: 520,
      title: '登录',
      resizable: false,
      frame: customWindowHeaderBar,
      autoHideMenuBar: true,
      minimizable: false,
      maximizable: false,
      parent,
      webPreferences: {
        preload: preloadLogin,
      },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      this.win.loadURL(url + PAGE_LOGIN);
    } else {
      this.win.loadFile(loginHtml);
    }
    this.registerHandle();
    return;
  }
  registerHandle() {
    ipcMain.handle(EVENT.LOGIN_CLOSE, () => {
      this.win.close();
      this.win = null;
      ipcMain.removeHandler(EVENT.LOGIN_CLOSE);
    });
  }
}
