import { BrowserWindow, ipcMain } from 'electron';
import { customWindowHeaderBar } from '../utils/platform';
import { join } from 'node:path';
import { EVENT } from '../utils/eventTypes';
import { PAGE_LOGIN } from '../../const';
const url = process.env.VITE_DEV_SERVER_URL;
const preloadLogin = join(__dirname, '../preload/login.js');
const loginHtml = join(process.env.DIST, PAGE_LOGIN);

export class Login {
  id: number | null;
  constructor(options) {
    this.createWindow(options);
  }
  async createWindow({ parent }) {
    if (this.id) {
      const win = this.getWindow(this.id);
      win.focus();
      return;
    }

    const win = new BrowserWindow({
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
    this.id = win.id;
    if (process.env.VITE_DEV_SERVER_URL) {
      win.loadURL(url + PAGE_LOGIN);
    } else {
      win.loadFile(loginHtml);
    }
    this.registerHandle();
    return;
  }
  registerHandle() {
    ipcMain.handle(EVENT.LOGIN_CLOSE, () => {
      const win = this.getWindow(this.id);
      win.close();
      ipcMain.removeHandler(EVENT.LOGIN_CLOSE);
    });
  }
  getWindow(id: number) {
    return BrowserWindow.fromId(id);
  }
}
