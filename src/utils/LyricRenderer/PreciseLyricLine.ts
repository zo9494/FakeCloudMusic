import { Container, Text, type Renderer } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { BaseLyricLine, IHightlightable } from './BaseLyricLine';
import type { LyricLineOptions, FontStyle } from './interface';
import type { LyricLine } from '../parseLyric';
import { LyricWordGraphics } from './LyricWordGraphics';

class PreciseWord extends Container implements IHightlightable {
  private wordGraphics: LyricWordGraphics;

  constructor(app: Application, text: string, style: FontStyle) {
    super();
    this.wordGraphics = new LyricWordGraphics(app, style);
    this.wordGraphics.createFromText(text);

    if (!this.wordGraphics.renderData) {
      return;
    }

    const { graphics, mask } = this.wordGraphics.renderData;
    this.addChild(graphics, mask);
  }

  highlight(progress: number = 1): void {
    this.wordGraphics.highlight(progress);
  }

  clearHighlight(): void {
    this.wordGraphics.clearHighlight();
  }

  updateMask(): void {
    this.wordGraphics.applyMask();
  }

  removeMask(): void {
    this.wordGraphics.removeMask();
  }
}

export class PreciseLyricLine extends Container implements BaseLyricLine {
  app: Application<Renderer>;
  words: PreciseWord[] = [];
  maxWidth: number;
  style: FontStyle;
  private lastHighlightIndex: number = -1;
  private lastHighlightProgress: number = -1;

  constructor(options: LyricLineOptions) {
    super();
    this.app = options.app;
    this.style = options.style;
    this.maxWidth = options.maxWidth;
    this.createLyricLine(options.line);
  }

  highlight(progress: number, highlightIndex: number): void {
    if (
      highlightIndex === this.lastHighlightIndex &&
      progress === this.lastHighlightProgress
    ) {
      return;
    }

    for (let i = 0; i < this.words.length; i++) {
      if (i > highlightIndex) {
        break;
      }
      const wordEl = this.words[i];
      if (i === highlightIndex) {
        wordEl.highlight(progress);
        break;
      }
      wordEl.highlight();
    }

    this.lastHighlightIndex = highlightIndex;
    this.lastHighlightProgress = progress;
  }

  createLyricLine(lyric: LyricLine): void {
    if (!lyric.children) {
      return;
    }

    let x = 0;
    let y = 0;
    let maxHeight = 0;

    lyric.children.forEach((word) => {
      const wordEl = new PreciseWord(this.app, word.text, this.style);

      if (x + wordEl.width >= this.maxWidth && x > 0) {
        x = 0;
        y += maxHeight;
        maxHeight = 0;
      }

      if (wordEl.height > maxHeight) {
        maxHeight = wordEl.height;
      }

      wordEl.x = x;
      wordEl.y = y;
      x += wordEl.width;

      this.words.push(wordEl);
      this.addChild(wordEl);
    });

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

  clearHighlight(): void {
    this.lastHighlightIndex = -1;
    this.lastHighlightProgress = -1;
    this.words.forEach((wordEl) => {
      wordEl.clearHighlight();
    });
  }

  updateMask(): void {
    this.words.forEach((wordEl) => {
      wordEl.updateMask();
    });
  }

  removeMask(): void {
    this.words.forEach((wordEl) => {
      wordEl.removeMask();
    });
  }
}