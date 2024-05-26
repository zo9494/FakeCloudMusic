import '../utils/env';
import {
  app,
  BrowserWindow,
  shell,
  globalShortcut,
  session,
  nativeImage,
  Tray,
  Menu,
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
import { chalk } from '../utils/chalk';
import type { MessageType } from 'naive-ui';

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

import './ipcMain';
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

const preload = join(__dirname, '../preload/index.js');

const url = process.env.VITE_DEV_SERVER_URL;

const indexHtml = join(process.env.DIST, 'index.html');
const vue_dev = join(process.cwd(), '/vue_devtools/');

let fileName = '';
interface GlobalType {
  mainWin: BrowserWindow;
  tray: Tray;
}
export const global: GlobalType = {
  mainWin: null,
  tray: null,
};

app.disableDomainBlockingFor3DAPIs();
app.whenReady().then(async () => {
  createMainWindow();
  createTray();
  if (isDevelopment || true) {
    globalShortcut.register('F10', () => {
      const wins = BrowserWindow.getAllWindows();
      wins.forEach(win => {
        win.webContents.openDevTools();
      });
    });

    console.log('F10', globalShortcut.isRegistered('F10'));
  }
  if (isDevelopment) {
    try {
      // console.log(`vueDevtools:${chalk.green(vue_dev)}`);
      await session.defaultSession.loadExtension(vue_dev, {
        allowFileAccess: true,
      });
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }

  session.defaultSession.on('will-download', (event, item, webContents) => {
    WIN.setProgressBar(item.getReceivedBytes() / item.getTotalBytes(), {
      mode: 'indeterminate',
    });
    // console.log(event, item, webContents);

    const path = join(app.getPath('music'), fileName);
    console.log(path);

    item.setSavePath(path);
    item.on('updated', () => {
      console.log(item);

      WIN.setProgressBar(item.getReceivedBytes() / item.getTotalBytes());
    });
    item.once('done', (event, state) => {
      if (state === 'completed') {
        WIN.setProgressBar(1, { mode: 'none' });
        console.log('Download successfully');
        WIN.webContents.send(EVENT.APP_DOWNLOAD_DONE);

        shell.showItemInFolder(path);
      } else {
        WIN.setProgressBar(0, { mode: 'error' });

        console.log(`Download failed: ${state}`);
      }
    });
  });
});

app.on('window-all-closed', () => {
  console.log('window-all-closed');
  app.exit();
});

app.on('second-instance', () => {
  if (global.mainWin) {
    // Focus on the main window if the user tried to open another
    if (global.mainWin.isMinimized()) global.mainWin.restore();
    global.mainWin.focus();
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

app.on('ready', () => {
  console.log(chalk.red('ready'));
});

app.on('before-quit', e => {
  console.log(chalk.red('before-quit'));
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
  global.mainWin = null;
});

function sendMessageToWeb(type: MessageType, text?: string) {
  global.mainWin.webContents.send(EVENT.SEND_MESSAGE, { type, text });
}

async function createMainWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
    },
    title: 'FakeCloudMusic',
    frame: customWindowHeaderBar,
    width: 1000,
    height: 600,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 5, y: 5 },
    autoHideMenuBar: true,
  });
  global.mainWin = win;
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
  // TODO:win 媒体控件
  win.setThumbarButtons([]);

  // WIN?.webContents.send(EVENT.APP_IS_DARK, nativeTheme.shouldUseDarkColors);
}

function createTray() {
  let iconPath: string = join(app.getAppPath(), '/dist/icons/icon.png');
  if (isMac) {
    iconPath = join(app.getAppPath(), '/dist/icons/iconTemplate.png');
  }
  if (isWin) {
    iconPath = join(app.getAppPath(), '/dist/icons/icon.ico');
  }

  // electron-builder extraResources
  const icon = nativeImage.createFromPath(
    isDevelopment ? 'public/icons/icon.png' : iconPath
  );
  global.tray = new Tray(icon);
  const trayArr: Electron.MenuItemConstructorOptions[] = [
    {
      label: '退出',
      click: () => {
        app.exit();
      },
    },
  ];
  if (isLinux) {
    trayArr.unshift({
      label: '显示',
      click: () => {
        global.mainWin.show();
      },
    });
  }
  const contextMenu = Menu.buildFromTemplate(trayArr);

  global.tray.setContextMenu(contextMenu);
  global.tray.setToolTip('FakeCloudMusic');
  global.tray.on('click', () => {
    if (isMac) {
      app.show();
    } else {
      global.mainWin.show();
    }
  });
}
