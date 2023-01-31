import '../utils/env';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  globalShortcut,
  session,
} from 'electron';
import { release } from 'node:os';
import { join } from 'node:path';
import server = require('NeteaseCloudMusicApi/server');
import { EVENT } from '../utils/eventTypes';
import { isDevelopment, isLinux, isMac, isWin } from '../utils/platform';

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();
import { Login } from './login';
// Set application name for Windows 10+ notifications
if (isWin) app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js');

const url = process.env.VITE_DEV_SERVER_URL;

const indexHtml = join(process.env.DIST, 'index.html');

const vue_dev = join(process.cwd(), '/vue_devtools/');

class Main {
  static win: BrowserWindow | null = null;
  static neteaseApi: any;
  constructor() {
    app.whenReady().then(() => {
      this.createServer();
      this.createWindow();
      this.registerAppEvent();
      this.registerHandle();
      this.registerGlobalShortcut();
    });
  }
  private async createWindow() {
    Main.win = new BrowserWindow({
      webPreferences: {
        preload,
        nodeIntegration: true,
      },
      frame: isMac,
      width: 1000,
      height: 600,
      minWidth: 900,
      minHeight: 600,
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 5, y: 5 },
    });
    if (process.env.VITE_DEV_SERVER_URL) {
      await Main.win.loadURL(url);
      // open devtools
      if (isDevelopment) {
        Main.win.webContents.openDevTools();
      }
    } else {
      Main.win.loadFile(indexHtml);
    }

    // Test actively push message to the Electron-Renderer
    Main.win.webContents.on('did-finish-load', () => {
      Main.win?.webContents.send(
        'main-process-message',
        new Date().toLocaleString()
      );
    });

    // Make all links open with the browser, not with the application
    Main.win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url);
      return { action: 'deny' };
    });
    return;
  }
  private async createServer() {
    const { server: expressApp } = await server.serveNcmApi({
      port: 35011,
    });
    console.log('[NeteaseCloudMusicApi]: started');
    Main.neteaseApi = expressApp;
    return;
  }
  // 全局事件
  private registerAppEvent() {
    app.on('window-all-closed', () => {
      Main.win = null;
      if (process.platform !== 'darwin') {
        app.quit();
        Main.neteaseApi.close(() => {
          console.log('[NeteaseCloudMusicApi]: closed');
        });
      }
    });

    app.on('second-instance', () => {
      const { win } = Main;
      if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore();
        win.focus();
      }
    });

    app.on('activate', () => {
      const allWindows = BrowserWindow.getAllWindows();
      if (allWindows.length) {
        allWindows[0].focus();
      } else {
        new Main();
      }
    });

    app.on('ready', async () => {
      if (isDevelopment) {
        try {
          await session.defaultSession.loadExtension(vue_dev);
          console.log(vue_dev);
        } catch (e) {
          console.error('Vue Devtools failed to install:', e.toString());
        }
      }
    });
  }
  /**
   * 全局handle
   */
  private registerHandle() {
    // window
    ipcMain.handle(EVENT.WINDOW_CLOSE, () => {
      app.quit();
    });
    ipcMain.handle(EVENT.WINDOW_RESIZ, () => {
      const { win } = Main;
      if (win.isMaximized()) {
        win.restore();
      } else {
        win.maximize();
      }
      return win.isMaximized();
    });

    ipcMain.handle(EVENT.WINDOW_MIN, () => {
      Main.win.minimize();
    });

    ipcMain.handle(EVENT.LOGIN, () => {
      new Login({ parent: Main.win });
    });
    ipcMain.handle(EVENT.RELOAD_USER, (_, args) => {
      return Main.win.webContents.executeJavaScript('window.loadUser()');
    });

    Login.registerHandle();
  }
  /**
   * 全局快捷键
   */
  private registerGlobalShortcut() {
    globalShortcut.register('F10', () => {
      Main.win && Main.win.webContents.openDevTools();
      Login.win && Login.win.webContents.openDevTools();
    });
  }
}

new Main();
