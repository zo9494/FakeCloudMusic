import { Container, Text, type Renderer } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { BaseLyricLine } from './BaseLyricLine';
import type { FontStyle, LyricLineOptions } from './interface';
import type { LyricLine } from '../parseLyric';
import { TextUtils } from './TextUtils';
import { LyricWordGraphics } from './LyricWordGraphics';

export class NormalLyricLine extends Container implements BaseLyricLine {
  app: Application<Renderer>;
  maxWidth: number;
  style: FontStyle;
  private lineGraphics: LyricWordGraphics;

  constructor(options: LyricLineOptions) {
    super();
    this.app = options.app;
    this.style = options.style;
    this.maxWidth = options.maxWidth;
    this.lineGraphics = new LyricWordGraphics(this.app, this.style);
    this.createLyricLine(options.line);
  }

  createLyricLine(lyric: LyricLine) {
    const text = TextUtils.getTextWrap(
      lyric.text,
      {
        fontSize: this.style.fontSize,
        fontWeight: this.style.fontWeight,
      },
      this.maxWidth,
    ).join('\n');

    this.lineGraphics.createFromText(text);

    if (!this.lineGraphics.renderData) {
      return;
    }

    const { graphics, mask } = this.lineGraphics.renderData;
    this.addChild(graphics, mask);

    if (lyric.translateText) {
      const translateText = new Text({
        text: lyric.translateText,
        style: {
          fill: this.style.normal.color,
          fontSize: this.style.fontSize,
          wordWrap: true,
          wordWrapWidth: this.maxWidth,
          breakWords: true,
        },
        alpha: this.style.normal.alpha,
      });
      translateText.y += mask.height;
      this.addChild(translateText);
    }
  }

  highlight(progress: number = 1): void {
    this.lineGraphics.highlight(progress | 0);
  }

  clearHighlight(): void {
    this.lineGraphics.clearHighlight();
  }

  updateMask(): void {
    this.lineGraphics.applyMask();
  }

  removeMask(): void {
    this.lineGraphics.removeMask();
  }
}