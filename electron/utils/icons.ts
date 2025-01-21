import { app } from 'electron';
import { join } from 'node:path';

export class Icons {
  private static getPath(path: string) {
    return join(app.getAppPath(), path);
  }
  static play = this.getPath('/dist/icons/play.png');
  static pause = this.getPath('/dist/icons/pause.png');
  static previous = this.getPath('/dist/icons/play-previous.png');
  static next = this.getPath('/dist/icons/play-next.png');
}
