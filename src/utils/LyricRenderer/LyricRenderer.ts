import { Application, Ticker } from 'pixi.js';
import { debounce } from 'lodash-es';
import type { LyricLine } from '../parseLyric';
import { NormalLyricLine } from './NormalLyricLine';
import { PreciseLyricLine } from './PreciseLyricLine';
import { ScrollManager, EasingFunctions } from './utils/ScrollManager';
import type { ScrollAnimationConfig } from './utils/ScrollManager';
import { FPSDisplay } from './utils/FPSDisplay';
import {
  lightModeStyle,
  createThemeListener,
  getStyleForTheme,
} from './utils/ThemeManager';
import {
  findCurrentLineIndex,
  findWordHighlightState,
} from './utils/HighlightState';
import { logElementCount } from './utils/debug';

interface LyricCanvasOptions {
  canvas: HTMLCanvasElement;
}

interface LyricLineEntry {
  visible: boolean;
  lyricLine: NormalLyricLine | PreciseLyricLine;
  id: number;
}

export class LyricRenderer {
  canvas: HTMLCanvasElement;
  app: Application;

  private initialized: Promise<void> | null = null;
  currentLineIndex: number = -1;
  currentWordIndex: number = -1;
  lineGap: number = 42;
  lyricLineEntries: LyricLineEntry[] = [];

  private style = lightModeStyle;
  private currentTime: number = 0;
  private previousTime: number = 0;
  private lyricData: LyricLine[] = [];
  private themeUnsubscribe: (() => void) | null = null;
  private viewHeight: number = 0;
  private viewWidth: number = 0;
  private readonly NORMAL_SCALE: number = 0.9;
  private readonly HIGHLIGHT_SCALE: number = 1.0;
  private currentScale: number[] = [];
  private targetScale: number[] = [];

  private animationConfig: ScrollAnimationConfig = {
    duration: 800,
    delayPerLine: 90,
    easingFunction: EasingFunctions.easeInOut,
  };

  private scrollManager: ScrollManager;
  private fpsDisplay: FPSDisplay;
  private debouncedResize: ReturnType<typeof debounce>;
  private _nextLineId: number = 0;
  private lineHeights: number[] = [];
  private scaleAnimId: number = 0;

  constructor(options: LyricCanvasOptions) {
    this.canvas = options.canvas;
    this.viewHeight =
      this.canvas.parentElement?.clientHeight || window.innerHeight;
    this.viewWidth =
      this.canvas.parentElement?.clientWidth || window.innerWidth;
    this.app = new Application();

    this.fpsDisplay = new FPSDisplay();
    this.scrollManager = new ScrollManager(
      this.animationConfig,
      this.onScrollUpdate
    );
    this.debouncedResize = debounce(() => this.onResize(), 400);
    this.initialized = this.init();
  }

  //  初始化 & 销毁

  /**
   * 异步初始化 Pixi Application、Ticker、主题监听与窗口 resize
   */
  private async init(): Promise<void> {
    await this.app.init({
      canvas: this.canvas,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      powerPreference: 'low-power',
      backgroundAlpha: 0,
      preference: 'webgl',
      resizeTo: this.canvas.parentElement || window,
    });

    this.updateViewDimensions();
    Ticker.shared.add(this.onTick, this);

    this.themeUnsubscribe = createThemeListener(isDark => {
      this.style = getStyleForTheme(isDark);
      this.onResize();
    });
    window.addEventListener('resize', this.debouncedResize);
  }

  private async whenReady(): Promise<void> {
    await this.initialized;
  }

  /** 每帧更新 FPS 显示 */
  private onTick = (): void => {
    this.fpsDisplay.update(this.viewWidth);
  };

  destroy(): void {
    this.scrollManager.stop();
    Ticker.shared.remove(this.onTick, this);
    window.removeEventListener('resize', this.debouncedResize);

    if (this.themeUnsubscribe) {
      this.themeUnsubscribe();
    }

    this.fpsDisplay.destroy();
    this.app.destroy();
  }

  //  视图尺寸 & resize

  private updateViewDimensions(): void {
    this.viewHeight = this.canvas.parentElement?.clientHeight || 0;
    this.viewWidth = this.canvas.parentElement?.clientWidth || 0;
  }

  /** 窗口尺寸变化时重建布局 */
  async onResize(): Promise<void> {
    if (!this.app.renderer || !this.canvas) {
      return;
    }

    this.updateViewDimensions();
    this.app.renderer.resize(this.viewWidth, this.viewHeight);

    if (this.lyricData.length > 0) {
      await this.createLyric(this.lyricData);
    }

    this.fpsDisplay.reposition(this.viewWidth);
    this.updateVisibleLinesMask();
  }

  //  歌词数据注入

  /** 设置歌词数据，若传入的数组引用与上次相同则跳过重建 */
  setLyric(lyric: LyricLine[]): void {
    if (this.lyricData === lyric) {
      return;
    }
    // 停止所有进行中的动画
    this.scrollManager.stop();
    // 取消缩放动画
    ++this.scaleAnimId;
    // 重置状态，确保新歌词从头开始高亮
    this.currentLineIndex = -1;
    this.currentTime = 0;
    this.previousTime = 0;
    this.lyricData = lyric;
    this.createLyric(lyric);
  }

  /**
   * 根据传入的歌词数组创建所有行并布局
   */
  private async createLyric(lyric: LyricLine[]): Promise<void> {
    await this.whenReady();
    this.updateViewDimensions();

    const availableWidth = Math.max(this.viewWidth - 20, 100);

    this.app.stage.removeChildren();
    this.lyricLineEntries.forEach(entry => entry.lyricLine.destroy());
    this.lyricLineEntries = [];

    this.currentScale = lyric.map(() => this.NORMAL_SCALE);
    this.targetScale = [...this.currentScale];
    this.lineHeights = new Array(lyric.length).fill(0);

    for (let index = 0; index < lyric.length; index++) {
      const line = lyric[index];
      const lyricLine = this.createLyricLine(line, availableWidth);

      if (index === 0) {
        const firstLineScale = this.currentScale[0] ?? this.NORMAL_SCALE;
        lyricLine.y =
          this.viewHeight / 2 - (lyricLine.height * firstLineScale) / 2;
      } else {
        const prevLine = this.lyricLineEntries[index - 1].lyricLine;
        const prevLineScale = this.currentScale[index - 1] ?? this.NORMAL_SCALE;
        lyricLine.y =
          prevLine.y + prevLine.height * prevLineScale + this.lineGap;
      }

      lyricLine.scale.set(this.currentScale[index]);
      lyricLine.x = 10;

      this.lyricLineEntries.push({
        visible: false,
        lyricLine,
        id: this._nextLineId++,
      });

      this.lineHeights[index] =
        lyricLine.height * this.currentScale[index] + this.lineGap;

      this.app.stage.addChild(lyricLine);
    }

    logElementCount(this.lyricLineEntries);

    if (
      this.currentLineIndex >= 0 &&
      this.currentLineIndex < this.lyricLineEntries.length
    ) {
      this.repositionToLine(this.currentLineIndex);
    }

    this.fpsDisplay.create();
    this.fpsDisplay.addToStage(this.app.stage);
    this.updateVisibleLinesMask();
  }

  /** 工厂：根据歌词行是否有 children 决定创建普通行还是逐字行 */
  private createLyricLine(
    line: LyricLine,
    width: number
  ): NormalLyricLine | PreciseLyricLine {
    if (line.children?.length) {
      return new PreciseLyricLine({
        app: this.app,
        line,
        maxWidth: width,
        style: this.style,
      });
    }
    return new NormalLyricLine({
      app: this.app,
      line,
      maxWidth: width,
      style: this.style,
    });
  }

  //  时间推进 & 高亮

  /** 外部每帧调用的时间更新入口 */
  setCurrentTime(millisecond: number = 0): void {
    if (millisecond === this.currentTime) {
      return;
    }
    this.currentTime = millisecond;
    this.updateHighlight();
  }

  private updateHighlight(): void {
    if (this.lyricData.length === 0) {
      return;
    }

    let newLineIndex = findCurrentLineIndex(
      this.lyricData,
      this.currentTime,
      this.currentLineIndex
    );

    if (newLineIndex !== this.currentLineIndex) {
      this.switchToLine(newLineIndex);
    }

    this.applyCurrentLineHighlight();
  }

  /** 切换高亮行：更新缩放目标、清除旧行、高亮新行、触发滚动 */
  private switchToLine(newLineIndex: number): void {
    if (
      this.currentLineIndex >= 0 &&
      this.currentLineIndex < this.currentScale.length
    ) {
      this.targetScale[this.currentLineIndex] = this.NORMAL_SCALE;
    }
    if (newLineIndex >= 0 && newLineIndex < this.currentScale.length) {
      this.targetScale[newLineIndex] = this.HIGHLIGHT_SCALE;
    }

    if (
      this.currentLineIndex >= 0 &&
      this.currentLineIndex < this.lyricLineEntries.length
    ) {
      this.lyricLineEntries[this.currentLineIndex].lyricLine.clearHighlight();
    }

    if (newLineIndex >= 0 && newLineIndex < this.lyricLineEntries.length) {
      const entry = this.lyricLineEntries[newLineIndex];
      if (entry.lyricLine instanceof NormalLyricLine) {
        entry.lyricLine.highlight(1);
      }
      this.scrollTo(newLineIndex);
    }

    this.currentLineIndex = newLineIndex;
    this.runScaleAnimation();
  }

  /** 应用当前行的词级或者行级高亮 */
  private applyCurrentLineHighlight(): void {
    if (
      this.currentLineIndex < 0 ||
      this.currentLineIndex >= this.lyricLineEntries.length
    ) {
      return;
    }

    const lineData = this.lyricData[this.currentLineIndex];
    const lineEl = this.lyricLineEntries[this.currentLineIndex].lyricLine;

    if (lineData.children?.length && lineEl instanceof PreciseLyricLine) {
      const { wordIndex, progress } = findWordHighlightState(
        lineData,
        this.currentTime
      );
      if (wordIndex >= 0) {
        lineEl.highlight(progress, wordIndex);
      } else {
        lineEl.clearHighlight();
      }
    } else {
      lineEl.highlight(1, 0);
    }
  }

  //  缩放动画

  /** 不影响滚动时的独立缩放过渡动画，使用 Pixi Ticker 而非独立 rAF */
  private runScaleAnimation(): void {
    if (this.scrollManager.running) {
      return;
    }

    const startTime = performance.now();
    const duration = this.animationConfig.duration;
    const startScales = [...this.currentScale];
    const animId = ++this.scaleAnimId;

    const animate = (): void => {
      if (animId !== this.scaleAnimId) {
        Ticker.shared.remove(animate, this);
        return;
      }

      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress >= 1) {
        for (let i = 0; i < this.currentScale.length; i++) {
          this.currentScale[i] = this.targetScale[i];
          if (this.lyricLineEntries[i]) {
            this.lyricLineEntries[i].lyricLine.scale.set(this.currentScale[i]);
            this.lineHeights[i] =
              this.lyricLineEntries[i].lyricLine.height * this.currentScale[i] +
              this.lineGap;
          }
        }
        Ticker.shared.remove(animate, this);
        return;
      }

      const easedProgress = this.animationConfig.easingFunction(progress);

      for (let i = 0; i < this.currentScale.length; i++) {
        this.currentScale[i] =
          startScales[i] +
          (this.targetScale[i] - startScales[i]) * easedProgress;

        if (this.lyricLineEntries[i]) {
          this.lyricLineEntries[i].lyricLine.scale.set(this.currentScale[i]);
          this.lineHeights[i] =
            this.lyricLineEntries[i].lyricLine.height * this.currentScale[i] +
            this.lineGap;
        }
      }
    };

    Ticker.shared.add(animate, this);
  }

  //  滚动

  /** 启动平滑滚动动画到目标行 */
  private scrollTo(targetLineIndex: number): void {
    const isRewind = this.currentTime < this.previousTime;
    if (this.scrollManager.running) {
      this.scrollManager.stop();
    }
    this.previousTime = this.currentTime;

    if (
      targetLineIndex < 0 ||
      targetLineIndex >= this.lyricLineEntries.length ||
      targetLineIndex === this.currentLineIndex
    ) {
      return;
    }

    const originalPositions = this.lyricLineEntries.map(entry => ({
      y: entry.lyricLine.y,
    }));

    const targetPositions = this.lyricLineEntries.map((_, index) => ({
      y: this.calculateTargetY(index, targetLineIndex),
    }));

    this.scrollManager.start(
      originalPositions,
      targetPositions,
      this.currentScale,
      this.targetScale,
      targetLineIndex,
      isRewind,
      () => this.updateVisibleLinesMask(),
      () => this.updateVisibleLinesMask()
    );
  }

  /** ScrollManager 每帧回调：更新行位置、缩放与高度缓存 */
  private onScrollUpdate = (
    lineIndex: number,
    y: number,
    scale: number
  ): void => {
    const entry = this.lyricLineEntries[lineIndex];
    if (!entry) return;

    entry.lyricLine.y = y;
    this.currentScale[lineIndex] = scale;
    entry.lyricLine.scale.set(scale);
    this.lineHeights[lineIndex] = entry.lyricLine.height * scale + this.lineGap;
  };

  //  布局计算

  /**
   * 计算指定行滚动到高亮位置时的目标 Y 坐标，使用预计算的高度缓存
   * @param index 当前行下标
   * @param highlightLineIndex 可选，高亮行下标，默认 currentLineIndex
   */
  private calculateTargetY(index: number, highlightLineIndex?: number): number {
    const highlightIndex = highlightLineIndex ?? this.currentLineIndex;

    if (highlightIndex === -1) {
      return this.calculateInitialY(index);
    }

    const highlightEntry = this.lyricLineEntries[highlightIndex];
    const highlightScale =
      this.currentScale[highlightIndex] ?? this.NORMAL_SCALE;
    const highlightLineHeight =
      highlightEntry.lyricLine.height * highlightScale;
    const highlightY = (this.viewHeight - highlightLineHeight) / 2;

    if (index === highlightIndex) {
      return highlightY;
    }

    if (index < highlightIndex) {
      let targetY = highlightY;
      for (let i = highlightIndex - 1; i >= index; i--) {
        targetY -= this.lineHeights[i] ?? 0;
      }
      return targetY;
    }

    let targetY = highlightY + highlightLineHeight + this.lineGap;
    for (let i = highlightIndex + 1; i < index; i++) {
      targetY += this.lineHeights[i] ?? 0;
    }
    return targetY;
  }

  /** 首次布局时计算第 index 行的初始 Y 坐标，使用预计算的高度缓存 */
  private calculateInitialY(index: number): number {
    if (index === 0) {
      const firstLineScale = this.currentScale[0] ?? this.NORMAL_SCALE;
      return (
        this.viewHeight / 2 -
        (this.lyricLineEntries[0].lyricLine.height * firstLineScale) / 2
      );
    }

    let preLinesHeight = 0;
    for (let i = 0; i < index; i++) {
      preLinesHeight += this.lineHeights[i] ?? 0;
    }
    return this.lyricLineEntries[0].lyricLine.y + preLinesHeight;
  }

  /** 布局重建后将所有行直接定位到目标行居中位置（无动画） */
  private repositionToLine(targetIndex: number): void {
    for (let i = 0; i < this.lyricLineEntries.length; i++) {
      const targetY = this.calculateTargetY(i, targetIndex);
      this.lyricLineEntries[i].lyricLine.y = targetY;
    }
  }

  //  可见行遮罩

  /** 遍历所有行，更新可见性变化时的遮罩状态 */
  private updateVisibleLinesMask(): void {
    this.lyricLineEntries.forEach(entry => {
      const isVisible = this.isLineVisible(entry);

      if (entry.visible !== isVisible) {
        if (isVisible) {
          entry.lyricLine.updateMask();
        } else {
          entry.lyricLine.removeMask();
        }
        entry.visible = isVisible;
      }
    });
  }

  private isLineVisible(entry: LyricLineEntry): boolean {
    const lineTop = entry.lyricLine.y;
    const lineBottom = entry.lyricLine.y + entry.lyricLine.height;
    return lineBottom > 0 && lineTop < this.viewHeight;
  }
}
