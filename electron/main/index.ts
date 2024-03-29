import '../utils/env';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  globalShortcut,
  session,
  nativeImage,
  Tray,
  Menu,
  nativeTheme,
  screen,
} from 'electron';
import { release } from 'node:os';
import { join } from 'node:path';
import { API } from '../utils/service';
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
import { createLogin } from './login';

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

let WIN: BrowserWindow;
let TRAY: Tray;
var fileName = '';

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

async function createMainWindow() {
  WIN = new BrowserWindow({
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

  if (process.env.VITE_DEV_SERVER_URL) {
    await WIN.loadURL(url);
    // open devtools
    if (isDevelopment) {
      WIN.webContents.openDevTools();
    }
  } else {
    WIN.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  WIN.webContents.on('did-finish-load', () => {
    WIN?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  WIN.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });

  WIN.on('close', e => {
    console.log('main-browserWindow: close');
    e.preventDefault();

    switch (process.platform) {
      case 'darwin':
        app.hide();
        break;

      default:
        WIN.webContents.send(EVENT.BEFORE_CLOSE);
        break;
    }
    return 0;
  });
  WIN.on('maximize', () => {
    WIN.webContents.send(EVENT.MAXIMIZE, true);
  });
  WIN.on('unmaximize', () => {
    WIN.webContents.send(EVENT.MAXIMIZE, false);
  });
  // TODO:win 媒体控件
  WIN.setThumbarButtons([]);
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
  TRAY = new Tray(icon);
  const trayArr: Electron.MenuItemConstructorOptions[] = [
    {
      label: '退出',
      // icon: nativeImage
      //   .createFromPath(
      //     isDevelopment
      //       ? 'public/icons/exit.png'
      //       : join(app.getAppPath(), 'dist/icons/exit.png')
      //   )
      //   .resize({ width: 16, height: 16 }),
      // // icon:
      click: () => {
        app.exit();
        // Main.win.webContents.send(EVENT.BEFORE_CLOSE);
      },
    },
  ];
  if (isLinux) {
    trayArr.unshift({
      label: '显示',

      click: () => {
        WIN.show();
      },
    });
  }
  const contextMenu = Menu.buildFromTemplate(trayArr);

  TRAY.setContextMenu(contextMenu);
  TRAY.setToolTip('FakeCloudMusic');
  TRAY.on('click', () => {
    if (isMac) {
      app.show();
    } else {
      WIN.show();
    }
  });
}

app.on('window-all-closed', () => {
  console.log('window-all-closed');
  app.exit();
});

app.on('second-instance', () => {
  if (WIN) {
    // Focus on the main window if the user tried to open another
    if (WIN.isMinimized()) WIN.restore();
    WIN.focus();
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
  WIN = undefined;
});
ipcMain.handle(EVENT.APP_CLOSE, () => {
  app.exit();
});

//#region window平台
ipcMain.handle(EVENT.WINDOW_RESIZ, () => {
  if (WIN.isMaximized()) {
    WIN.restore();
  } else {
    WIN.maximize();
  }
});

ipcMain.handle(EVENT.WINDOW_MIN, () => {
  WIN.minimize();
});

ipcMain.handle(EVENT.MINIMIZE_TO_TRAY, () => {
  WIN.hide();
});
//#endregion

ipcMain.handle(EVENT.LOGIN, () => {
  console.log('login');

  createLogin({ parent: WIN });
});
ipcMain.handle(EVENT.RELOAD_USER, () => {
  return WIN.webContents.executeJavaScript('window.loadUser()');
});
// 修改title
ipcMain.handle(EVENT.SET_TITLE, (_, title?: string) => {
  if (title) {
    TRAY.setToolTip(title);
    WIN.setTitle(title);
  }
});
ipcMain.handle(EVENT.WINDOW_SHOW, () => {
  WIN.show();
});

ipcMain.handle(EVENT.WINDOW_CLOSE, e => {
  const win = BrowserWindow.fromWebContents(e.sender);
  win.close();
});

ipcMain.handle(EVENT.HTTP, async (_, { url, params }) => {
  try {
    return await API(url, params);
  } catch (error) {
    console.log(111, error);
    return { error };
  }
});

ipcMain.handle(EVENT.SAVE_SONG, async (_, song) => {
  try {
    const res = await API('song_url', { id: song.id });
    const url = res.body.data[0].url;
    const artists = song.artists || song.ar;
    const artist = artists.map(it => it.name).join(',');
    fileName = `${song.name}-${artist + url.substring(url.lastIndexOf('.'))}`;
    WIN.webContents.downloadURL(url);
  } catch (error) {
    return { error };
  }
  // console.log('download:  ', song);

  // downloadMusic('./', song);
});

function sendMessageToWeb(type: MessageType, text?: string) {
  WIN.webContents.send(EVENT.SEND_MESSAGE, { type, text });
}
