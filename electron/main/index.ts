// todo 重构
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
import server = require('NeteaseCloudMusicApi/server');
import { EVENT } from '../utils/eventTypes';
import { isDevelopment, isLinux, isMac, isWin } from '../utils/platform';
import { chalk } from '../utils/chalk';
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
  static tray: Tray;
  canClose = false;
  title: string;
  constructor() {
    this.title = 'FakeCloudMusic';
    // todo 深色模式根据系统
    console.log(nativeTheme.shouldUseDarkColors);

    app.whenReady().then(async () => {
      this.createServer();
      this.createWindow();
      this.registerAppEvent();
      this.registerHandle();
      this.registerGlobalShortcut();
      this.createTray();
      if (isDevelopment) {
        try {
          console.log(`vueDevtools:${chalk.green(vue_dev)}`);
          await session.defaultSession.loadExtension(vue_dev, {
            allowFileAccess: true,
          });
        } catch (e) {
          console.error('Vue Devtools failed to install:', e.toString());
        }
      }
    });
  }
  private async createWindow() {
    Main.win = new BrowserWindow({
      webPreferences: {
        preload,
        nodeIntegration: true,
      },
      title: this.title,
      frame: isMac,
      width: 1000,
      height: 600,
      minWidth: 1000,
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
    // 主窗口 app:before-quit => browserWindow:close
    // mac 红绿灯 会触发close事件
    Main.win.on('close', e => {
      console.log('main-browserWindow: close');

      if (isMac) {
        e.preventDefault();
        app.hide();
        return;
      }

      if (isWin) {
        e.preventDefault();
        Main.win.webContents.send(EVENT.BEFORE_CLOSE);
        return;
      }
    });
    Main.win.on('maximize', () => {
      Main.win.webContents.send(EVENT.MAXIMIZE, true);
    });
    Main.win.on('unmaximize', () => {
      Main.win.webContents.send(EVENT.MAXIMIZE, false);
    });
    return;
  }
  private async createServer() {
    const { server: expressApp } = await server.serveNcmApi({
      port: 35011,
    });
    console.log(`[NeteaseCloudMusicApi]: ${chalk.green('started')}`);
    Main.neteaseApi = expressApp;
    return;
  }
  // 全局事件
  private registerAppEvent() {
    app.on('window-all-closed', () => {
      console.log('window-all-closed');
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

    app.on('ready', () => {
      app.disableDomainBlockingFor3DAPIs();
      console.log(chalk.red('ready'));
    });
    // mac 右键退出触发 app：before-quit => browserWindow:close
    app.on('before-quit', e => {
      console.log(chalk.red('before-quit'));
      // win平台
      if (isWin) {
        console.log('this.canClose: ', this.canClose);

        // if (!this.canClose) {
        //   e.preventDefault();
        // }
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
      Main.win = undefined;
      Main.neteaseApi.close(() => {
        console.log(`[NeteaseCloudMusicApi]: ${chalk.red('closed')}`);
      });
      Main.neteaseApi = undefined;
    });
  }
  /**
   * 注册渲染进程事件
   */
  private registerHandle() {
    // window平台
    ipcMain.handle(EVENT.WINDOW_CLOSE, () => {
      app.exit();
    });
    ipcMain.handle(EVENT.WINDOW_RESIZ, () => {
      debugger;
      const { win } = Main;
      if (win.isMaximized()) {
        win.restore();
      } else {
        win.maximize();
      }
    });

    ipcMain.handle(EVENT.WINDOW_MIN, () => {
      Main.win.minimize();
    });

    ipcMain.handle(EVENT.MINIMIZE_TO_TRAY, () => {
      Main.win.hide();
    });
    // window平台

    ipcMain.handle(EVENT.LOGIN, () => {
      const loginWin = new Login({ parent: Main.win });
      loginWin.registerHandle();
    });
    ipcMain.handle(EVENT.RELOAD_USER, () => {
      return Main.win.webContents.executeJavaScript('window.loadUser()');
    });
    // 修改title
    ipcMain.handle(EVENT.SET_TITLE, (_, title?: string) => {
      if (title) {
        Main.tray.setToolTip(title);
        Main.win.setTitle(title);
      }
    });
    ipcMain.handle(EVENT.WINDOW_SHOW, () => {
      Main.win.show();
    });
    //#region 拖动且顶部可点击 但不能边缘最大化
    // let winStartPosition = { x: 0, y: 0 };
    // let mouseStartPosition = { x: 0, y: 0 };
    // let timer = null;
    // ipcMain.handle(EVENT.WINDOW_MOVE_START, () => {
    //   const position = Main.win.getPosition();
    //   winStartPosition.x = position[0];
    //   winStartPosition.y = position[1];
    //   mouseStartPosition = screen.getCursorScreenPoint();
    //   const contentBounds = Main.win.getContentBounds();
    //   console.log(contentBounds);

    //   timer = setInterval(() => {
    //     const cursorPosition = screen.getCursorScreenPoint();
    //     const x = winStartPosition.x + cursorPosition.x - mouseStartPosition.x;
    //     const y = winStartPosition.y + cursorPosition.y - mouseStartPosition.y;
    //     Main.win.setContentBounds(
    //       {
    //         width: contentBounds.width,
    //         height: contentBounds.height,
    //         x,
    //         y,
    //       },
    //       true
    //     );
    //   }, 10);
    // });

    // ipcMain.handle(EVENT.WINDOW_MOVE_END, () => {
    //   clearInterval(timer);
    // });
    //#endregion
  }
  /**
   * 全局快捷键
   */
  private registerGlobalShortcut() {
    if (isDevelopment) {
      globalShortcut.register('F10', () => {
        Main.win && Main.win.webContents.openDevTools();
        Login.win && Login.win.webContents.openDevTools();
      });
    }
  }

  private createTray() {
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
    Main.tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '退出',
        icon: nativeImage
          .createFromPath(
            isDevelopment
              ? 'public/icons/exit.png'
              : join(app.getAppPath(), 'dist/icons/exit.png')
          )
          .resize({ width: 16, height: 16 }),
        // icon:
        click: () => {
          // app.exit();
          Main.win.webContents.send(EVENT.BEFORE_CLOSE);
        },
      },
    ]);

    Main.tray.setContextMenu(contextMenu);
    Main.tray.setToolTip(this.title);
    Main.tray.on('click', () => {
      if (isMac) {
        app.show();
      } else {
        Main.win.show();
      }
    });
  }
}

new Main();
