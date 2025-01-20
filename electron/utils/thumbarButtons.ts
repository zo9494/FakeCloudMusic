import { BrowserWindow, nativeImage } from 'electron';
import { Icons } from './icons';
import { EVENT } from './eventTypes';

export class Thumbar {
  private win: BrowserWindow;
  private playButton = {
    click: () => {
      console.log('play');
      this.win.webContents.send(EVENT.APP_AUDIO_PLAY, true);
    },
    tooltip: '播放',
    icon: nativeImage.createFromPath(Icons.play),
  };
  private pauseButton = {
    click: () => {
      console.log('paused');
      this.win.webContents.send(EVENT.APP_AUDIO_PLAY, false);
    },
    tooltip: '暂停',
    icon: nativeImage.createFromPath(Icons.pause),
  };
  private buttons: Electron.ThumbarButton[];
  constructor(win: BrowserWindow) {
    this.win = win;
    this.buttons = [
      {
        click: () => {
          console.log('previous');
          this.win.webContents.send(EVENT.APP_AUDIO_PREVIOUS);
        },
        tooltip: '上一首',
        icon: nativeImage.createFromPath(Icons.previous),
      },
      this.playButton,
      {
        click: () => {
          console.log('next');
          this.win.webContents.send(EVENT.APP_AUDIO_NEXT);
        },
        tooltip: '下一首',
        icon: nativeImage.createFromPath(Icons.next),
      },
    ];

    this.win.setThumbarButtons(this.buttons);
  }

  public play(paused: boolean) {
    if (paused) {
      this.buttons[1] = this.playButton;
    } else {
      this.buttons[1] = this.pauseButton;
    }
    this.win.setThumbarButtons(this.buttons);
  }
}
