import { app, nativeTheme } from 'electron';
import { join } from 'node:path';
import { application, SYSTEM_IS_DARK_MODE } from '../main/application';
import { isMac, isWin } from './platform';
import { theme } from '../main/theme';

export class Icons {
  private static getPath(path = '') {
    if (process.env.NODE_ENV === 'development') {
      return join('public/icons', path);
    }
    return join(app.getAppPath(), '/dist/icons', path);
  }
  // 获取当前主题图标
  static get currentThemePath() {
    if (theme.useDark) {
      return this.getPath('/dark');
    }
    return this.getPath();
  }
  static get basePath() {
    return this.getPath();
  }
  static get play(): string {
    return this.getPath('/dark') + '/play.png';
  }
  static get pause(): string {
    return this.getPath('/dark') + '/pause.png';
  }
  static get previous(): string {
    return this.getPath('/dark') + '/play-previous.png';
  }

  static get next(): string {
    return this.getPath('/dark') + '/play-next.png';
  }

  static get trayIcon() {
    if (isWin) {
      return this.getPath('icon.ico');
    }
    if (isMac) {
      return this.getPath('iconTemplate.png');
    }
    return this.getPath('icon.png');
  }

  static get exit() {
    return Icons.currentThemePath + '/exit.png';
  }

  static get eye() {
    return Icons.currentThemePath + '/eye.png';
  }
}
