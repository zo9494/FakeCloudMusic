import { app } from 'electron';
import { join } from 'node:path';

export class Icons {
  private static getPath(path: string) {
    return join(app.getAppPath(), path);
  }
  static play = this.getPath('/dist/icons/play-stroke-rounded.png');
  static pause = this.getPath('/dist/icons/pause-stroke-rounded.png');
  static previous = this.getPath('/dist/icons/previous-stroke-rounded.png');
  static next = this.getPath('/dist/icons/next-stroke-rounded.png');
}
