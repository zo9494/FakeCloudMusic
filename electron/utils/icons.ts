import { app, nativeTheme } from 'electron';
import { join } from 'node:path';
import { application, SYSTEM_IS_DARK_MODE } from '../main/application';

export class Icons {
  private static getPath(path: string) {
    return join(app.getAppPath(), path);
  }
  static get basePath() {
    if (SYSTEM_IS_DARK_MODE) {
      return this.getPath('/dist/icons/dark');
    }
    return this.getPath('/dist/icons');
  }

  static get play(): string {
    return Icons.basePath + '/play.png';
  }
  static get pause(): string {
    return Icons.basePath + '/pause.png';
  }
  static get previous(): string {
    return Icons.basePath + '/play-previous.png';
  }

  static get next(): string {
    return Icons.basePath + '/play-next.png';
  }
}
