import { getImageColor } from './utils';
export class LyricsBackground {
  private mainColor: [number, number, number] = [0, 0, 0];
  private lastUrl: string | null = null;
  private token = 0;

  /**
   * 设置歌词页面背景
   * @param {string} url
   * @param {boolean} useDynamicBg 是否启用动态背景
   */
  async setAlImage(url: string, useDynamicBg = false) {
    // 去重：同一张图重复调用直接跳过
    if (this.lastUrl === url) return;
    this.lastUrl = url;
    const myToken = ++this.token;
    // 将计算与样式更新放到空闲回调，避免抢占关键渲染
    const schedule = (cb: () => void) => {
      const rif = (window as any).requestIdleCallback as
        | ((cb: () => void) => number)
        | undefined;
      if (rif) rif(cb);
      else setTimeout(cb, 0);
    };
    schedule(async () => {
      const color = await getImageColor(url);
      // 如果期间又触发了新请求，则放弃旧结果
      if (myToken !== this.token) return;
      this.mainColor = color;
      this.setStaticBg();
    });
  }
  setStaticBg() {
    document.documentElement.style.cssText = `--bg-img:linear-gradient(0deg,rgb(${this.mainColor.join(
      ','
    )}),rgb(245,245,245))`;
  }
}

export const lyricsBackground = new LyricsBackground();
