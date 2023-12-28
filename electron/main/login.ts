import { BrowserWindow, ipcMain } from 'electron';
import { customWindowHeaderBar } from '../utils/platform';
import { join } from 'node:path';
import { EVENT } from '../utils/eventTypes';
import { PAGE_LOGIN } from '../../const';
const url = process.env.VITE_DEV_SERVER_URL;
const preloadLogin = join(__dirname, '../preload/login.js');
const loginHtml = join(process.env.DIST, PAGE_LOGIN);

let win: BrowserWindow;

export function createLogin(options) {
  if (win && !win.isDestroyed()) {
    win.focus();
    return;
  }

  win = new BrowserWindow({
    width: 320,
    height: 520,
    title: '登录',
    resizable: false,
    frame: customWindowHeaderBar,
    // frame: true,
    autoHideMenuBar: true,
    minimizable: false,
    maximizable: false,
    parent: options.parent,
    webPreferences: {
      preload: preloadLogin,
    },
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(url + PAGE_LOGIN);
  } else {
    win.loadFile(loginHtml);
  }
}
