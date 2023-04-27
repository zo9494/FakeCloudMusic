import { BrowserWindow, ipcMain } from 'electron';

import { join } from 'node:path';
import { EVENT } from '../utils/eventTypes';

const url = process.env.VITE_DEV_SERVER_URL;
const preloadLogin = join(__dirname, '../preload/login.js');
const loginHtml = join(process.env.DIST, '/login/index.html');

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
      frame: false,
      minimizable: false,
      maximizable: false,
      modal: true,
      parent,
      webPreferences: {
        preload: preloadLogin,
      },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      this.win.loadURL(url + '/login/');
    } else {
      this.win.loadFile(loginHtml);
    }
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
