import { BrowserWindow, nativeImage, ThumbarButton } from 'electron';
import { Icons } from '../utils/icons';
import { EVENT } from '../utils/eventTypes';

export class Thumbar {
  private win: BrowserWindow;
  private buttons: Electron.ThumbarButton[];
  constructor(win: BrowserWindow) {
    this.win = win;

    this.setButtons();
  }

  public setButtons() {
    this.buttons = [
      {
        click: () => {
          console.log('previous');
          this.win.webContents.send(EVENT.APP_AUDIO_PREVIOUS);
        },
        tooltip: '上一首',
        icon: nativeImage.createFromPath(Icons.previous),
      },
      {
        click: () => {
          console.log('paused');
          this.win.webContents.send(EVENT.APP_AUDIO_TOGGLE_PLAY, false);
        },
        tooltip: '暂停',
        icon: nativeImage.createFromPath(Icons.pause),
        flags: ['hidden'],
      },
      {
        click: () => {
          console.log('play');
          this.win.webContents.send(EVENT.APP_AUDIO_TOGGLE_PLAY, true);
        },
        tooltip: '播放',
        icon: nativeImage.createFromPath(Icons.play),
        flags: [],
      },
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
  // setThumbarButtons() {
  //   this.win.setThumbarButtons(this.buttons);
  // }
  public togglePlay(paused: boolean) {
    const [_, pausedButton, playButton] = this.buttons;
    if (paused) {
      // 显示播放按键
      playButton.flags = [];
      pausedButton.flags = ['hidden'];
    } else {
      // 显示暂停按键
      pausedButton.flags = [];
      playButton.flags = ['hidden'];
    }
    this.win.setThumbarButtons(this.buttons);
  }
  public resetButtons() {
    this.win.setThumbarButtons(this.buttons);
  }
}
