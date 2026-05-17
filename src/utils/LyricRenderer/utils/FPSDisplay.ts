import { Container, Text } from 'pixi.js';

export class FPSDisplay {
  private fpsText: Text | null = null;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;

  create(): Text {
    this.fpsText = new Text({
      text: 'FPS: 0',
      style: {
        fontSize: 18,
        fill: 'orange',
      },
    });
    return this.fpsText;
  }

  addToStage(stage: Container): void {
    if (this.fpsText) {
      stage.addChild(this.fpsText);
    }
  }

  update(viewWidth: number): void {
    const now = Date.now();
    this.frameCount++;

    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;

      if (this.fpsText) {
        this.fpsText.text = `FPS: ${this.fps}`;
        this.fpsText.position.set(viewWidth - this.fpsText.width - 10, 10);
      }
    }
  }

  reposition(viewWidth: number): void {
    if (this.fpsText) {
      this.fpsText.position.set(viewWidth - this.fpsText.width - 10, 10);
    }
  }

  destroy(): void {
    if (this.fpsText) {
      this.fpsText.destroy();
      this.fpsText = null;
    }
  }
}