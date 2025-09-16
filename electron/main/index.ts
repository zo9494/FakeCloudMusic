import '../utils/env';
import {
  app,
  BrowserWindow,
  shell,
  session,
  nativeImage,
  Tray,
  Menu,
  screen,
  nativeTheme,
} from 'electron';
import { release } from 'node:os';
import { join } from 'node:path';
import { EVENT } from '../utils/eventTypes';
import {
  isDevelopment,
  isLinux,
  isMac,
  isWin,
  customWindowHeaderBar,
} from '../utils/platform';
import '../utils/console';
import { Thumbar } from './thumbar.service';
import './ipcMain';
import { setupDevTools } from './devtools';
import { application } from './application';
import dns from 'dns';
import { Icons } from '../utils/icons';
import { AppTray } from './tray';
import { theme } from './theme';

// 设置 DNS 解析默认优先 IPv4
dns.setDefaultResultOrder('ipv4first');
// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (isWin) app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  console.log('SingleInstanceLock');
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

const preload = join(__dirname, '../preload/index.js');

const url = process.env.VITE_DEV_SERVER_URL;

const indexHtml = join(process.env.DIST, 'index.html');

app.disableDomainBlockingFor3DAPIs();

app.whenReady().then(() => {
  start();
});
//#region function

async function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const DefaultHeight = (height * 0.86) >> 0;
  const DefaultWidth = (width * 0.76) >> 0;

  const win = new BrowserWindow({
    webPreferences: {
      preload,
      // nodeIntegration: true,
    },
    title: 'FakeCloudMusic',
    frame: customWindowHeaderBar,
    width: DefaultWidth,
    height: DefaultHeight,
    minWidth: DefaultWidth,
    minHeight: DefaultHeight,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 5, y: 5 },
    autoHideMenuBar: true,
  });

  // const originalSend = win.webContents.send.bind(win.webContents);

  // win.webContents.send = function (channel, ...args) {
  //   console.log('my send:', channel);

  //   originalSend(channel, ...args);
  // };

  if (process.env.VITE_DEV_SERVER_URL) {
    await win.loadURL(url);
    // open devtools
    if (isDevelopment) {
      win.webContents.openDevTools();
    }
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

  win.on('close', e => {
    console.log('main-browserWindow: close');
    e.preventDefault();

    switch (process.platform) {
      case 'darwin':
        app.hide();
        break;

      default:
        win.webContents.send(EVENT.BEFORE_CLOSE);
        break;
    }
    return 0;
  });
  win.on('maximize', () => {
    win.webContents.send(EVENT.MAXIMIZE, true);
  });
  win.on('unmaximize', () => {
    win.webContents.send(EVENT.MAXIMIZE, false);
  });

  return win;
  // WIN?.webContents.send(EVENT.APP_IS_DARK, nativeTheme.shouldUseDarkColors);
}

//#endregion

async function start() {
  const win = await createMainWindow();
  application.win = win;

  application.thumbar = new Thumbar(win);
  application.tray = new AppTray();

  theme.on('change', () => {
    application.tray.setContextMenu();
  });
  setupDevTools(app);

  session.defaultSession.on('will-download', (event, item, webContents) => {
    win.setProgressBar(item.getReceivedBytes() / item.getTotalBytes(), {
      mode: 'indeterminate',
    });
    // console.log(event, item, webContents);
    // item.fileName = fileName;
    const path = join(app.getPath('music'), application.downloadFileName);
    console.log(path);

    item.setSavePath(path);
    item.on('updated', () => {
      console.log(item);

      win.setProgressBar(item.getReceivedBytes() / item.getTotalBytes());
    });
    item.once('done', (event, state) => {
      if (state === 'completed') {
        win.setProgressBar(1, { mode: 'none' });
        console.log('Download successfully');
        win.webContents.send(EVENT.APP_DOWNLOAD_DONE);

        shell.showItemInFolder(path);
      } else {
        win.setProgressBar(0, { mode: 'error' });

        console.log(`Download failed: ${state}`);
      }
    });
  });

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.41';
    details.requestHeaders['Origin'] = details.requestHeaders['host'];
    callback({ requestHeaders: details.requestHeaders });
  });
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (details.responseHeaders['access-control-allow-origin']) {
      details.responseHeaders['access-control-allow-origin'] = ['*'];
    } else if (details.responseHeaders['Access-Control-Allow-Origin']) {
      details.responseHeaders['Access-Control-Allow-Origin'] = ['*'];
    } else {
      details.responseHeaders['Access-Control-Allow-Origin'] = ['*'];
    }
    callback({
      cancel: false,
      responseHeaders: details.responseHeaders,
    });
  });
}

//#region app.on
app.on('window-all-closed', () => {
  console.log('window-all-closed');
  app.exit();
});

app.on('second-instance', () => {
  console.log('second-instance');
  const win = application.win;
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  console.log('app activate');

  // const allWindows = BrowserWindow.getAllWindows();
  // if (allWindows.length) {
  //   allWindows[0].focus();
  // } else {
  //   new Main();
  // }
});
app.on('will-finish-launching', () => {
  console.log('will-finish-launching');
});
app.on('ready', () => {
  console.log('ready');
});

app.on('before-quit', e => {
  console.log('before-quit');
  // win平台
  if (isWin) {
  }
  // mac平台
  if (isMac) {
    app.exit();
  }
});
app.on('will-quit', () => {
  console.log('will-quit');
});
app.on('quit', () => {
  console.log('quit');
});

//#endregion
