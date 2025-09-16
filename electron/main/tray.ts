import { app, Menu, nativeImage, Tray } from 'electron';
import { Icons } from '../utils/icons';
import { application } from './application';
import { isMac } from '../utils/platform';
export class AppTray {
  private tray: Tray;
  constructor() {
    this.init();
  }

  get trayMenuItems() {
    return [
      {
        label: '显示主窗口',
        click: () => {
          application.win.show();
        },
        icon: nativeImage
          .createFromPath(Icons.eye)
          .resize({ width: 16, height: 16 }),
      },
      {
        label: '退出',
        click: () => {
          app.exit();
        },
        icon: nativeImage
          .createFromPath(Icons.exit)
          .resize({ width: 16, height: 16 }),
      },
    ];
  }
  private init() {
    const tray = new Tray(nativeImage.createFromPath(Icons.trayIcon));
    this.tray = tray;
    this.setContextMenu();
    tray.setToolTip('FakeCloudMusic');
    tray.on('click', () => {
      if (isMac) {
        app.show();
      } else {
        application.win.show();
        application.thumbar.resetButtons();
      }
    });
  }
  setToolTip(toolTip: string) {
    this.tray.setToolTip(toolTip);
  }
  setContextMenu() {
    const contextMenu = Menu.buildFromTemplate(this.trayMenuItems);
    this.tray.setContextMenu(contextMenu);
  }
}
