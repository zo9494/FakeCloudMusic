import { Ticker } from 'pixi.js';

export interface ScrollAnimationConfig {
  duration: number;
  delayPerLine: number;
  easingFunction: (t: number) => number;
}

export const EasingFunctions = {
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
};

interface LineAnimationState {
  originalY: number;
  targetY: number;
  originalScale: number;
  targetScale: number;
}

export type ScrollUpdateCallback = (
  lineIndex: number,
  y: number,
  scale: number,
) => void;

export class ScrollManager {
  private config: ScrollAnimationConfig;
  private isAnimating: boolean = false;
  private startTime: number = 0;
  private isRewind: boolean = false;
  private lineStates: LineAnimationState[] = [];
  private targetLineIndex: number = -1;
  private onUpdate: ScrollUpdateCallback;
  private onComplete: (() => void) | null = null;
  private onTick: (() => void) | null = null;

  constructor(
    config: ScrollAnimationConfig,
    onUpdate: ScrollUpdateCallback,
  ) {
    this.config = config;
    this.onUpdate = onUpdate;
  }

  start(
    originalPositions: { y: number }[],
    targetPositions: { y: number }[],
    originalScales: number[],
    targetScales: number[],
    targetLineIndex: number,
    isRewind: boolean,
    onComplete?: () => void,
    onTick?: () => void,
  ): void {
    if (this.isAnimating) {
      this.stop();
    }

    this.lineStates = originalPositions.map((_, i) => ({
      originalY: originalPositions[i]?.y ?? 0,
      targetY: targetPositions[i]?.y ?? 0,
      originalScale: originalScales[i] ?? 1,
      targetScale: targetScales[i] ?? 1,
    }));

    this.targetLineIndex = targetLineIndex;
    this.isRewind = isRewind;
    this.startTime = Date.now();
    this.onComplete = onComplete ?? null;
    this.onTick = onTick ?? null;

    this.isAnimating = true;
    Ticker.shared.add(this.animate, this);
  }

  stop(): void {
    if (this.isAnimating) {
      Ticker.shared.remove(this.animate, this);
      this.isAnimating = false;
    }
  }

  get running(): boolean {
    return this.isAnimating;
  }

  private animate = (): void => {
    this.onTick?.();

    const elapsed = Date.now() - this.startTime;
    const totalDuration =
      this.config.duration +
      (this.lineStates.length - 1) * this.config.delayPerLine;
    const overallProgress = Math.min(elapsed / totalDuration, 1);

    for (let i = 0; i < this.lineStates.length; i++) {
      const state = this.lineStates[i];

      let lineDelay = 0;
      if (this.isRewind) {
        if (i < this.targetLineIndex) {
          lineDelay = (this.targetLineIndex - i) * this.config.delayPerLine;
        }
      } else {
        if (i > this.targetLineIndex) {
          lineDelay = (i - this.targetLineIndex) * this.config.delayPerLine;
        }
      }

      const lineElapsed = Math.max(0, elapsed - lineDelay);
      const lineProgress = Math.min(
        lineElapsed / this.config.duration,
        1,
      );

      const easedProgress = this.config.easingFunction(lineProgress);

      const y =
        state.originalY + (state.targetY - state.originalY) * easedProgress;
      const scale =
        state.originalScale +
        (state.targetScale - state.originalScale) * easedProgress;

      this.onUpdate(i, y, scale);
    }

    if (overallProgress >= 1) {
      this.stop();

      // 确保精确最终位置
      for (let i = 0; i < this.lineStates.length; i++) {
        const state = this.lineStates[i];
        this.onUpdate(i, state.targetY, state.targetScale);
      }

      this.onComplete?.();
    }
  };
}