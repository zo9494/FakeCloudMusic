import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  type Mask,
  type Renderer,
} from 'pixi.js';
import type { BaseLyricLine, BaseLyricLineWord } from './BaseLyricLine';
import type {
  LyricLineOptions,
  LyricLineWordType,
  FontStyle,
} from './interface';
import type { LyricLine } from '../parseLyric';

class LyricLineWord extends Container implements BaseLyricLineWord {
  word?: LyricLineWordType;
  app: Application;
  style: FontStyle;
  constructor(app: Application, text: string, style: FontStyle) {
    super();
    this.app = app;
    this.style = style;
    this.createWord(text);
  }

  createWord(text: string) {
    // 用文字生成遮罩纹理
    const textTexture = this.app.renderer.canvasText.getTexture({
      text,
      style: {
        // 遮罩
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
      mask,
    };
    //大量的mask会导致性能问题
    // graphics.mask = mask;
    this.addChild(graphics, mask);
  }
  /**
   * 高亮
   */
  highlight(progress = 1): void {
    if (!this.word) {
      return;
    }
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
  updateMask() {
    if (!this.word) {
      return;
    }
    this.word.graphics.mask = this.word.mask;
  }
  removeMask() {
    if (!this.word) {
      return;
    }
    this.word.graphics.mask = null;
  }
}
/**
 * 逐字歌词行
 */
export class PreciseLyricLine extends Container implements BaseLyricLine {
  app: Application<Renderer>;
  words: LyricLineWord[] = [];
  maxWidth: number;
  style: FontStyle;
  constructor(options: LyricLineOptions) {
    super();
    this.app = options.app;
    this.style = options.style;
    this.maxWidth = options.maxWidth;
    this.createLyricLine(options.line);
  }

  /**
   *
   * @param progress 0=不高亮；1=完全高亮
   * @param highlightIndex 要高亮的word下标
   */
  highlight(progress: number, highlightIndex: number): void {
    for (let i = 0; i < this.words.length; i++) {
      if (i > highlightIndex) {
        break;
      }
      const word = this.words[i];
      if (i == highlightIndex) {
        word.highlight(progress);
        break;
      }

      word.highlight();
    }
  }
  createLyricLine(lyric: LyricLine): void {
    if (lyric.children) {
      // 用于给主歌词定位
      let x = 0;
      let y = 0;
      // 逐字歌词当前行的最高高度
      let maxHeight = 0;
      lyric.children.forEach((word) => {
        const char = new LyricLineWord(this.app, word.text, this.style);

        // 检查是否需要换行
        if (x + char.width >= this.maxWidth && x > 0) {
          // 换行（确保不是第一个字符）
          x = 0;
          y += maxHeight;
          maxHeight = 0; // 重置maxHeight
        }

        // 更新当前行的最大高度
        if (char.height > maxHeight) {
          maxHeight = char.height;
        }

        char.x = x;
        char.y = y;
        x += char.width;

        this.words.push(char);
        this.addChild(char);
      });
      // 翻译行
      if (lyric.translateText) {
        const translateText = new Text({
          text: lyric.translateText,
          style: {
            fill: this.style.normal.color,
            fontSize: this.style.fontSize * 0.6,
            wordWrap: true,
            wordWrapWidth: this.maxWidth,
            breakWords: true,
          },
          alpha: this.style.normal.alpha,
        });
        translateText.y = y + maxHeight;
        this.addChild(translateText);
      }
    }
  }

  clearHighlight(): void {
    this.words.forEach((char) => {
      char.clearHighlight();
    });
  }
  updateMask() {
    this.words.forEach((char) => {
      char.updateMask();
    });
  }
  removeMask() {
    this.words.forEach((char) => {
      char.removeMask();
    });
  }
}
