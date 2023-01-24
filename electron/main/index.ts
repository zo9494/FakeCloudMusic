import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { release } from 'node:os';
import { join } from 'node:path';
import server = require('NeteaseCloudMusicApi/server');
import { chalk } from '../utils/chalk';
import { EVENT } from '../utils/eventTypes';
import { isDevelopment, isLinux, isMac, isWin } from '../utils/platform';

console.log(`__dirname:${chalk.red(__dirname)}`);

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

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

class Main {
  win: BrowserWindow | null;
  neteaseApi: any;
  constructor() {}
  init() {}
  async createWindow() {
    const win = new BrowserWindow({
      webPreferences: {
        preload,
        nodeIntegration: true,
      },
      frame: isMac,
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      // electron-vite-vue#298
      await win.loadURL(url);
      // Open devTool if the app is not packaged
      win.webContents.openDevTools();
    } else {
      win.loadFile(indexHtml);
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
      win?.webContents.send(
        'main-process-message',
        new Date().toLocaleString()
      );
    });

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url);
      return { action: 'deny' };
    });
    return win;
  }
  async createServer() {
    const { server: expressApp } = await server.serveNcmApi({
      port: 35011,
    });
    console.log(`[NeteaseCloudMusicApi]: ${chalk.green('started')}`);

    return expressApp;
  }
}

let win: BrowserWindow | null = null;
let serverApp;
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js');
const preloadLogin = join(__dirname, '../preload/login.js');

const url = process.env.VITE_DEV_SERVER_URL;

const indexHtml = join(process.env.DIST, 'index.html');
const loginHtml = join(process.env.DIST, '/login/index.html');

async function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
    },
    frame: isMac,
    width: 900,
    height: 600,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 5, y: 5 },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    await win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}
async function createServer() {
  const { server: expressApp } = await server.serveNcmApi({
    port: 35011,
  });
  console.log(`[NeteaseCloudMusicApi]: ${chalk.green('started')}`);

  return expressApp;
}

app.whenReady().then(() => {
  createServer().then(expressApp => {
    serverApp = expressApp;
  });
  createWindow();
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
    serverApp.close(() => {
      console.log(`[NeteaseCloudMusicApi]: ${chalk.red('closed')}`);
    });
  }
});

app.on('second-instance', () => {
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
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

// window
ipcMain.handle(EVENT.WINDOW_CLOSE, () => {
  app.quit();
});
ipcMain.handle(EVENT.WINDOW_RESIZ, () => {
  if (win.isMaximized()) {
    win.restore();
  } else {
    win.maximize();
  }
  return win.isMaximized();
});

ipcMain.handle(EVENT.WINDOW_MIN, () => {
  win.minimize();
});

let loginWin: null | BrowserWindow = null;
ipcMain.handle(EVENT.LOGIN, async () => {
  if (loginWin) {
    loginWin.focus();
  } else {
    loginWin = new BrowserWindow({
      width: 350,
      height: 530,
      title: '登录',
      resizable: false,
      frame: false,
      parent: win,
      webPreferences: {
        preload: preloadLogin,
      },
    });
    if (process.env.VITE_DEV_SERVER_URL) {
      await loginWin.loadURL(url + '/login/');
      loginWin.webContents.openDevTools();
    } else {
      loginWin.loadFile(loginHtml);
    }
  }
});
ipcMain.handle(EVENT.LOGIN_CLOSE, () => {
  loginWin.close();
  loginWin = null;
});
