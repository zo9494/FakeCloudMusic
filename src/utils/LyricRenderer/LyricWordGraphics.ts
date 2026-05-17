import { Application, Graphics, Sprite, type Renderer } from 'pixi.js';
import type { FontStyle, LyricWordRenderData } from './interface';

export class LyricWordGraphics {
  private app: Application<Renderer>;
  private style: FontStyle;
  renderData?: LyricWordRenderData;
  private lastProgress: number = -1;

  constructor(app: Application<Renderer>, style: FontStyle) {
    this.app = app;
    this.style = style;
  }

  createFromText(text: string): void {
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

    this.renderData = {
      height: mask.height,
      width: mask.width,
      graphics,
      mask,
    };
  }

  highlight(progress: number = 1): void {
    if (!this.renderData || progress === this.lastProgress) {
      return;
    }
    this.lastProgress = progress;

    const { graphics, width, height } = this.renderData;
    const highlightWidth = Math.round(width * progress);
    graphics.clear();
    graphics
      .rect(0, 0, highlightWidth, height)
      .fill(this.style.highlight)
      .rect(highlightWidth, 0, width - highlightWidth, height)
      .fill(this.style.normal);
  }

  clearHighlight(): void {
    this.lastProgress = -1;
    this.highlight(0);
  }

  applyMask(): void {
    if (!this.renderData) {
      return;
    }
    this.renderData.graphics.mask = this.renderData.mask;
  }

  removeMask(): void {
    if (!this.renderData) {
      return;
    }
    this.renderData.graphics.mask = null;
  }

  get width(): number {
    return this.renderData?.width ?? 0;
  }

  get height(): number {
    return this.renderData?.height ?? 0;
  }
}