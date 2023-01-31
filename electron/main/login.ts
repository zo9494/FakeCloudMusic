import { BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { EVENT } from '../utils/eventTypes';

const url = process.env.VITE_DEV_SERVER_URL;
const preloadLogin = join(__dirname, '../preload/login.js');
const loginHtml = join(process.env.DIST, '/login/index.html');

export class Login {
  static win: BrowserWindow | null = null;
  constructor(options) {
    this.createWindow(options);
  }
  private async createWindow({ parent }) {
    if (Login.win) {
      Login.win.focus();
      return;
    }

    Login.win = new BrowserWindow({
      width: 320,
      height: 520,
      title: '登录',
      resizable: false,
      frame: false,
      minimizable: false,
      maximizable: false,
      parent,
      webPreferences: {
        preload: preloadLogin,
      },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      Login.win.loadURL(url + '/login/');
    } else {
      Login.win.loadFile(loginHtml);
    }
    return;
  }
  static registerHandle() {
    ipcMain.handle(EVENT.LOGIN_CLOSE, () => {
      this.win.close();
      this.win = null;
    });
  }
}
