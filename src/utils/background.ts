import { getImageColor } from './utils';
import { BackgroundRender, PixiRenderer } from '@applemusic-like-lyrics/core';
import '@pixi/unsafe-eval';
export class LyricsBackground {
  private mainColor: [number, number, number] = [0, 0, 0];
  private lyricsBackground: BackgroundRender<PixiRenderer> | undefined;

  /**
   * 设置歌词页面背景
   * @param {string} url
   * @param {boolean} useDynamicBg 是否启用动态背景
   */
  async setAlImage(url: string, useDynamicBg = false) {
    if (useDynamicBg) {
      const canvas = document.createElement('canvas');
      const renderer = new PixiRenderer(canvas);
      const lyricsBackground = new BackgroundRender(renderer, canvas);
      lyricsBackground.setAlbum(url);
      lyricsBackground.setFPS(30);
      document
        .querySelector('.f-lyrics-bg')
        ?.appendChild(lyricsBackground.getElement());
      this.lyricsBackground = lyricsBackground;
    } else {
      this.mainColor = await getImageColor(url);
      this.setStaticBg();
    }
  }
  setStaticBg() {
    document.documentElement.style.cssText = `--bg-img:linear-gradient(0deg,rgb(${this.mainColor.join(
      ','
    )}),rgb(245,245,245))`;
  }
  pause() {
    this.lyricsBackground?.pause();
  }
  resume() {
    this.lyricsBackground?.resume();
  }
}

export const lyricsBackground = new LyricsBackground();
