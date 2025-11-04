import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  type Renderer,
} from 'pixi.js';
import type { BaseLyricLine } from './BaseLyricLine';
import type {
  FontStyle,
  LyricLineOptions,
  LyricLineWordType,
} from './interface';
import type { LyricLine } from '../parseLyric';
import { TextUtils } from './TextUtils';

/**
 * 普通行带高亮歌词
 */
export class NormalLyricLine extends Container implements BaseLyricLine {
  app: Application<Renderer>;
  word?: LyricLineWordType;
  maxWidth: number;
  style: FontStyle;
  constructor(options: LyricLineOptions) {
    super();
    this.app = options.app;
    this.style = options.style;
    this.maxWidth = options.maxWidth;
    this.createLyricLine(options.line);
  }

  createLyricLine(lyric: LyricLine) {
    const text = TextUtils.getTextWrap(
      lyric.text,
      {
        fontSize: 32,
        fontWeight: 'bold',
      },
      this.maxWidth
    ).join('\n'); //因为普通行是整体高亮，因此直接插入\n换行就行
    console.log('normalLine', text);

    // 用文字生成遮罩纹理
    const textTexture = this.app.renderer.canvasText.getTexture({
      text,
      style: {
        fill: 0xffffff,
        fontSize: this.style.fontSize,
        fontWeight: this.style.fontWeight,
      },
    });

    const mask = new Sprite(textTexture);

    const graphics = new Graphics();
    graphics.rect(0, 0, mask.width, mask.height).fill(this.style.normal);
    this.word = {
      height: mask.height,
      width: mask.width,
      graphics,
    };
    //
    graphics.mask = mask;
    this.addChild(graphics, mask);

    if (lyric.translateText) {
      // 因为翻译肯定都是中文，直接使用pixi的换行也满足要求
      const translateText = new Text({
        text: lyric.translateText,
        style: {
          fill: this.style.normal.color,
          fontSize: this.style.fontSize,
        },
        alpha: this.style.normal.alpha,
      });

      translateText.y += mask.height;

      this.addChild(translateText);
    }
  }

  /**
   * 高亮
   */
  highlight(progress = 1): void {
    if (!this.word) {
      return;
    }
    // 普通行只接受0，1
    progress = progress | 0;
    const { graphics, width, height } = this.word;
    const highlightWidth = width * progress;
    graphics.clear();

    graphics
      .rect(0, 0, highlightWidth, height)
      .fill(this.style.highlight)
      .rect(highlightWidth, 0, width - highlightWidth, height)
      .fill(this.style.normal);
  }

  clearHighlight(): void {
    this.highlight(0);
  }
}
