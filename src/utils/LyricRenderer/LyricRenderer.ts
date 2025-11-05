import { Application, Ticker, Text } from 'pixi.js';
import { debounce } from 'lodash-es';
import type { LyricLine } from '../parseLyric';
import { NormalLyricLine } from './NormalLyricLine';
import { PreciseLyricLine } from './PreciseLyricLine';
import type { FontStyle } from './interface';
import 'pixi.js/unsafe-eval';

interface LyricCanvasOptions {
  canvas: HTMLCanvasElement;
}

interface AnimationConfig {
  duration: number;
  delayPerLine: number;
  easingFunction: (t: number) => number;
}

const EasingFunctions = {
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
};

const darkModeStyle: FontStyle = {
  fontSize: 28,
  fontWeight: 'bold',
  normal: {
    color: 0xffffff,
    alpha: 0.5,
  },
  highlight: {
    color: 0xffffff,
    alpha: 1,
  },
};
const lightModeStyle: FontStyle = {
  fontSize: 28,
  fontWeight: 'bold',
  normal: {
    color: 0x000000,
    alpha: 0.5,
  },
  highlight: {
    color: 0x000000,
    alpha: 1,
  },
};

// 主题监听器
function createThemeListener(callback: (isDark: boolean) => void) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  // 初始调用
  callback(mediaQuery.matches);

  // 监听变化
  mediaQuery.addEventListener('change', handleChange);

  // 返回取消监听函数
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}

let id = 0
interface Line {
  // 行是否可见
  visible: boolean,
  el: NormalLyricLine | PreciseLyricLine,
  id: number,
}

// 歌词渲染器
export class LyricRenderer {
  canvas: HTMLCanvasElement;
  app: Application;
  // 初始化标志
  private initialized: Promise<void> | null = null;
  currentLineIndex: number = -1;

  currentWordIndex: number = -1;
  lineGap: number = 42;
  lines: Line[] = [];
  private style = lightModeStyle;
  private currentTime: number = 0;
  private previousTime: number = 0;
  // 歌词数据
  private lyricData: LyricLine[] = [];
  private themeUnsubscribe: (() => void) | null = null;

  // 可视区域尺寸
  private viewHeight: number = 0;
  private viewWidth: number = 0;

  // 平滑滚动相关属性
  private isScrolling: boolean = false;
  private scrollStartTime: number = 0;
  private originalPositions: { y: number }[] = [];
  private targetPositions: { y: number }[] = [];
  private targetLineIndex: number = -1;
  private isRewind: boolean = false;

  // 帧率显示相关属性
  private fpsText: Text | null = null;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;

  // 缩放相关属性
  private currentScale: number[] = [];
  private targetScale: number[] = [];
  private readonly NORMAL_SCALE: number = 0.9;
  private readonly HIGHLIGHT_SCALE: number = 1.0;

  private animationConfig: AnimationConfig = {
    // 移动持续时间（毫秒）
    duration: 800,
    // 每行歌词的延迟移动的时间（毫秒）
    delayPerLine: 90,
    easingFunction: EasingFunctions.easeInOut,
  };

  private debouncedResize = debounce(() => this.onResize(), 400);

  constructor(options: LyricCanvasOptions) {
    console.log('LyricRenderer constructor called');
    this.canvas = options.canvas;
    this.viewHeight =
      this.canvas.parentElement?.clientHeight || window.innerHeight;
    this.viewWidth =
      this.canvas.parentElement?.clientWidth || window.innerWidth;
    this.app = new Application();
    this.initialized = this.init();
  }

  private async init() {
    // 获取canvas尺寸
    await this.app.init({
      canvas: this.canvas,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      powerPreference: 'high-performance',
      backgroundAlpha: 0,
      resizeTo: this.canvas.parentElement || window, // 添加自动调整尺寸配置
    });

    // 更新可视区域尺寸
    this.updateView()


    // 添加帧率更新到ticker

    Ticker.shared.add(this.updateFps, this);
    this.themeUnsubscribe = createThemeListener((isDark) => {
      this.onThemeChange(isDark);
    });
    window.addEventListener('resize', this.debouncedResize);
  }

  private async whenReady() {
    await this.initialized;
  }

  /**
   * 独立的帧率更新方法
   */
  private updateFps() {
    // 计算帧率
    const now = Date.now();
    this.frameCount++;

    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;

      // 更新帧率显示
      if (this.fpsText) {
        this.fpsText.text = `FPS: ${this.fps}`;
        // 重新计算位置以确保文本在右上角
        this.fpsText.position.set(this.viewWidth - this.fpsText.width - 10, 10);
      }
    }
  }

  /**
   * 更新可视区尺寸
   */
  private updateView() {
    this.viewHeight = this.canvas.parentElement?.clientHeight || 0
    this.viewWidth = this.canvas.parentElement?.clientWidth || 0
  }

  /**
   * 创建歌词
   */
  private async createLyric(lyric: LyricLine[]) {
    console.time('createLyric');
    await this.whenReady();

    // 确保获取到正确的视图尺寸
    this.updateView()

    // 可用宽度 left 10;right 10，确保最小宽度为100px
    const availableWidth = Math.max(this.viewWidth - 20, 100);
    console.log('availableWidth', availableWidth, 'viewWidth', this.viewWidth);


    this.app.stage.removeChildren();

    this.lines.forEach((line) => line.el.destroy());
    this.lines = [];

    // 初始化缩放数组
    this.currentScale = lyric.map(() => this.NORMAL_SCALE);
    this.targetScale = [...this.currentScale];

    // 计算所有行的位置，但不立即添加到画布
    for (let index = 0; index < lyric.length; index++) {
      const line = lyric[index];
      const lyricLine = this.createLyricLine(line, availableWidth);

      if (index === 0) {
        // 第一行位于屏幕中间
        const firstLineScale = this.currentScale[0] ?? this.NORMAL_SCALE;
        lyricLine.y = this.viewHeight / 2 - (lyricLine.height * firstLineScale) / 2;
      } else {
        // 后续行基于前一行位置
        const prevLine = this.lines[index - 1].el;
        const prevLineScale = this.currentScale[index - 1] ?? this.NORMAL_SCALE;
        lyricLine.y = prevLine.y + prevLine.height * prevLineScale + this.lineGap;
      }

      // 应用初始缩放
      lyricLine.scale.set(this.currentScale[index]);

      // console.log(index, lyricLine.height);

      lyricLine.x = 10;

      this.lines.push({
        visible: false,
        el: lyricLine,
        id: id++,
      });

      this.app.stage.addChild(lyricLine);
      id++;
    }



    console.timeEnd('createLyric');
    console.log(this);
    //统计 test

    CountEl(this.lines);
    // 创建帧率显示文本
    this.createFPSText();

    // 初次渲染完成后更新遮罩状态
    this.updateVisibleLinesMask();
  }

  /**
   * 创建帧率显示文本
   */
  private createFPSText() {
    this.fpsText = new Text({
      text: 'FPS: 0',
      style: {
        fontSize: 18,
        fill: 'orange',
      }
    });
      // 将帧率文本添加到舞台
      this.app.stage.addChild(this.fpsText);
      this.updateFpsTextPosition();
  }

  /**
   * 创建歌词行
   */
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
  getLyric() {
    return this.lines;
  }

  /**
   * 更新帧率文本位置
   */
  private updateFpsTextPosition() {
    if (this.fpsText) {
      // 确保可视区域尺寸是最新的
      if (this.canvas) {
        this.viewHeight = this.canvas.clientHeight;
        this.viewWidth = this.canvas.clientWidth;
      }

      // 更新帧率显示位置到右上角

      this.fpsText.position.set(this.viewWidth - this.fpsText.width - 10, 10);
    }
  }

  /**
   * 处理窗口大小变化
   * 重新计算歌词布局并更新UI
   */
  async onResize() {
    if (this.app.renderer && this.canvas) {
      // 强制更新canvas尺寸，确保获取到正确的尺寸
      this.updateView()
      // 更新可视区域尺寸

      // 重新设置渲染器尺寸
      this.app.renderer.resize(this.viewWidth, this.viewHeight);

      // 重新创建歌词
      if (this.lyricData.length > 0) {
        await this.createLyric(this.lyricData);
      }

      // 更新帧率显示位置到右上角
      this.updateFpsTextPosition();

      // 如果已有歌词数据，更新布局
      if (this.lyricData.length > 0) {
        // 更新可见行
        this.updateVisibleLines();
      }
    }
  }

  /**
   * 处理主题改变
   */
  onThemeChange(isDark: boolean) {
    if (isDark) {
      this.style = darkModeStyle;
    } else {
      this.style = lightModeStyle;
    }
    this.onResize();
  }

  /**
   * 设置歌词
   * @param lyric 解析后的歌词
   */
  setLyric(lyric: LyricLine[]) {
    // 检查是否与当前歌词相同
    if (this.lyricData == lyric) {
      debugger

      return;
    }

    this.lyricData = lyric;
    this.createLyric(lyric);
  }

  /**
   * 设置播放进度
   * @param millisecond 毫秒
   */
  setCurrentTime(millisecond: number = 0) {
    console.log('当前高亮行索引:', this.currentLineIndex);
    this.currentTime = millisecond;
    this.updateLyricHighlight();
    // 更新可见行的遮罩状态
    this.updateVisibleLinesMask();
  }

  /**
   * 更新歌词高亮
   */
  private updateLyricHighlight() {
    if (this.lyricData.length === 0) return;

    // 找到当前应该高亮的歌词行
    let newLineIndex = -1;
    for (let i = 0; i < this.lyricData.length; i++) {
      const line = this.lyricData[i];
      const nextLine = this.lyricData[i + 1];

      // 如果有下一行，当前时间在本行和下一行之间
      if (
        nextLine &&
        this.currentTime >= line.time &&
        this.currentTime < nextLine.time
      ) {
        newLineIndex = i;
        break;
      }
      // 如果是最后一行，且当前时间大于等于本行时间
      else if (!nextLine && this.currentTime >= line.time) {
        newLineIndex = i;
        break;
      }
    }

    // 如果没有找到新的高亮行，但当前有高亮行，则继续高亮当前行
    if (newLineIndex === -1 && this.currentLineIndex >= 0 && this.currentLineIndex < this.lyricData.length) {
      const currentLine = this.lyricData[this.currentLineIndex];
      // 如果当前时间已经超过了当前高亮行的时间，继续高亮当前行
      if (this.currentTime >= currentLine.time) {
        newLineIndex = this.currentLineIndex;
      }
    }

    // 如果找到了新的高亮行，或者取消高亮
    if (newLineIndex !== this.currentLineIndex) {
      // 更新目标缩放值
      if (this.currentLineIndex >= 0 && this.currentLineIndex < this.currentScale.length) {
        this.targetScale[this.currentLineIndex] = this.NORMAL_SCALE;
      }
      if (newLineIndex >= 0 && newLineIndex < this.currentScale.length) {
        this.targetScale[newLineIndex] = this.HIGHLIGHT_SCALE;
      }

      // 取消之前高亮的行
      if (
        this.currentLineIndex >= 0 &&
        this.currentLineIndex < this.lines.length
      ) {
        const prevLine = this.lines[this.currentLineIndex].el;
        prevLine.clearHighlight();
      }

      // 高亮新的行
      if (newLineIndex >= 0 && newLineIndex < this.lines.length) {
        const currentLine = this.lines[newLineIndex];
        // 如果是普通歌词行，直接高亮整行
        if (currentLine instanceof NormalLyricLine) {
          currentLine.highlight(1);
        }
        // 逐字歌词行不在行切换时高亮，由后续逻辑处理
        this.scrollTo(newLineIndex);
      }

      this.currentLineIndex = newLineIndex;

      // 触发缩放动画
      this.triggerScaleAnimation();
    }

    // 处理当前高亮行的具体高亮逻辑
    if (this.currentLineIndex >= 0 && this.currentLineIndex < this.lines.length) {
      const currentLineData = this.lyricData[this.currentLineIndex];
      const currentLineEl = this.lines[this.currentLineIndex].el;

      // 检查是否为逐字歌词
      if (
        currentLineData.children &&
        currentLineData.children.length > 0 &&
        currentLineEl instanceof PreciseLyricLine
      ) {
        // 计算当前应该高亮到哪个字符
        let wordIndex = -1;
        let progress = 0;
        let allWordsCompleted = true;

        // 查找当前时间对应的字符
        for (let i = 0; i < currentLineData.children.length; i++) {
          const child = currentLineData.children[i];

          // 如果当前时间在这个字符的时间范围内
          if (this.currentTime >= child.time && this.currentTime < child.time + child.duration) {
            wordIndex = i;
            progress = (this.currentTime - child.time) / child.duration;
            allWordsCompleted = false;
            break;
          }
          // 如果当前时间已经过了这个字符
          else if (this.currentTime >= child.time + child.duration) {
            wordIndex = i;
            progress = 1;
          }
          // 如果当前时间还没到这个字符
          else {
            allWordsCompleted = false;
            break; // 一旦遇到还没到的字符，说明前面的字符都已完成
          }
        }

        // 如果找到了对应的字符，则更新高亮
        if (wordIndex >= 0) {
          currentLineEl.highlight(progress, wordIndex);
        } else if (allWordsCompleted) {
          // 如果所有字符都已经完成，则高亮整行
          currentLineEl.highlight(1, currentLineData.children.length - 1);
        } else {
          // 如果时间还没到第一个字符，不高亮任何字符
          currentLineEl.clearHighlight();
        }
      } else {
        // 普通歌词行，直接高亮整行
        currentLineEl.highlight(1, 0);
      }

      // 更新可见行的遮罩状态
      this.updateVisibleLinesMask();
    }
  }



  /**
   * 更新方法 - 实现平滑缩放动画逻辑
   */
  update(deltaTime: number): void {
    // 这个方法现在主要用于非动画状态下的微调
    // 主要的动画逻辑已经在triggerScaleAnimation和animateScroll中处理
    // 保留此方法以维持接口兼容性
  }

  /**
   * 平滑滚动到指定行，使其位于垂直方向中间
   */
  private scrollTo(targetLineIndex: number) {

    // 检测回拉进度
    const isRewind = this.currentTime < this.previousTime;
    // 如果正在滚动，先停止当前滚动
    if (this.isScrolling) {
      Ticker.shared.remove(this.animateScroll, this);
      this.isScrolling = false;
    }

    // 更新previousTime
    this.previousTime = this.currentTime;

    // 如果目标行索引无效或与当前高亮行相同，不执行滚动
    if (targetLineIndex < 0 || targetLineIndex >= this.lines.length || targetLineIndex === this.currentLineIndex) {
      return;
    }

    // 记录原始位置
    const originalPositions = this.lines.map(line => ({ y: line.el.y }));

    // 计算目标位置（使用目标行索引作为高亮行）
    const targetPositions = this.lines.map((_, index) => ({ y: this.calculateTargetY(index, targetLineIndex) }));

    // 启动平滑滚动（传入回拉标志）
    this.startSmoothScroll(originalPositions, targetPositions, targetLineIndex, isRewind);
  }

  /**
   * 计算指定行的目标Y坐标
   * 当高亮行滚动到屏幕中间时，其他行保持相对位置
   */
  private calculateTargetY(index: number, highlightLineIndex?: number): number {
    const highlightIndex = highlightLineIndex ?? this.currentLineIndex;

    // 如果没有高亮行（highlightIndex为-1），则使用初始布局
    if (highlightIndex === -1) {
      // 初始布局：第一行在中间，其他行依次排列
      if (index === 0) {
        // 考虑第一行的缩放
        const firstLineScale = this.currentScale[0] ?? this.NORMAL_SCALE;
        return this.viewHeight / 2 - (this.lines[0].el.height * firstLineScale) / 2;
      } else {
        let preLinesHeight = 0;
        for (let i = 0; i < index; i++) {
          // 考虑缩放对行高度的影响
          const scale = this.currentScale[i] ?? this.NORMAL_SCALE;
          preLinesHeight += this.lines[i].el.height * scale + this.lineGap;
        }
        // 考虑第一行的缩放
        const firstLineScale = this.currentScale[0] ?? this.NORMAL_SCALE;
        return this.lines[0].el.y + preLinesHeight;
      }
    }

    // 计算所有行的高度（包括间距和缩放影响）
    const heights: number[] = [];
    for (let i = 0; i < this.lines.length; i++) {
      // 考虑缩放对行高度的影响
      const scale = this.currentScale[i] ?? this.NORMAL_SCALE;
      heights[i] = this.lines[i].el.height * scale + this.lineGap;
    }

    // 计算高亮行上方所有行的总高度
    let aboveHeight = 0;
    for (let i = 0; i < highlightIndex; i++) {
      aboveHeight += heights[i];
    }

    // 计算高亮行下方所有行的总高度
    let belowHeight = 0;
    for (let i = highlightIndex + 1; i < this.lines.length; i++) {
      belowHeight += heights[i];
    }

    // 计算高亮行的高度（不包括间距）
    const highlightLineHeight = this.lines[highlightIndex].el.height * (this.currentScale[highlightIndex] ?? this.NORMAL_SCALE);

    // 计算高亮行的Y坐标，确保上下间距相等
    const highlightY = (this.viewHeight - highlightLineHeight) / 2;

    // 计算目标行的Y坐标
    if (index === highlightIndex) {
      return highlightY;
    } else if (index < highlightIndex) {
      // 高亮行上方的行：从高亮行向上累加
      let targetY = highlightY;
      for (let i = highlightIndex - 1; i >= index; i--) {
        targetY -= heights[i];
      }
      return targetY;
    } else {
      // 高亮行下方的行：从高亮行向下累加
      let targetY = highlightY + highlightLineHeight + this.lineGap;
      for (let i = highlightIndex + 1; i < index; i++) {
        targetY += heights[i];
      }
      return targetY;
    }
  }

  /**
   * 开始平滑滚动动画
   */
  private startSmoothScroll(originalPositions: { y: number }[], targetPositions: { y: number }[], targetLineIndex: number, isRewind: boolean) {

    // 如果正在滚动，先停止当前滚动
    if (this.isScrolling) {
      Ticker.shared.remove(this.animateScroll, this);
      this.isScrolling = false;
    }

    // 保存动画参数
    this.originalPositions = originalPositions;
    this.targetPositions = targetPositions;
    this.targetLineIndex = targetLineIndex;
    this.isRewind = isRewind;
    this.scrollStartTime = Date.now();
    // 开始动画
    this.isScrolling = true;
    Ticker.shared.add(this.animateScroll, this);
  }

  /**
   * 平滑滚动动画 - 波浪传递效果
   * 实现严格的行级顺序延迟动画机制
   */
  private animateScroll() {
    // 计算帧率
    const now = Date.now();
    this.frameCount++;

    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;

      // 更新帧率显示
      if (this.fpsText) {
        this.fpsText.text = `FPS: ${this.fps}`;
        // 重新计算位置以确保文本在右上角
        this.fpsText.position.set(this.viewWidth - this.fpsText.width - 10, 10);
      }
    }

    const elapsed = Date.now() - this.scrollStartTime;
    const totalAnimationDuration = this.animationConfig.duration + (this.lines.length - 1) * this.animationConfig.delayPerLine;
    const overallProgress = Math.min(elapsed / totalAnimationDuration, 1);

    // 更新所有行的位置，实现严格的顺序延迟机制
    this.lines.forEach((line, index) => {
      const originalY = this.originalPositions[index]?.y ?? line.el.y;
      const targetY = this.targetPositions[index]?.y ?? this.calculateTargetY(index, this.targetLineIndex);

      // 计算当前行的延迟时间
      let lineDelay = 0;

      if (this.isRewind) {
        // 回拉模式：从高亮行向上传递动画
        if (index < this.targetLineIndex) {
          // 高亮行之前的行：行号越小，延迟越大
          const distance = this.targetLineIndex - index;
          lineDelay = distance * this.animationConfig.delayPerLine;
        }
      } else {
        // 正常播放模式：从高亮行向下传递动画
        if (index > this.targetLineIndex) {
          // 高亮行之后的行：行号越大，延迟越大
          const distance = index - this.targetLineIndex;
          lineDelay = distance * this.animationConfig.delayPerLine;
        }
      }

      // 计算当前行的动画进度
      const lineElapsed = Math.max(0, elapsed - lineDelay);
      let lineProgress = Math.min(lineElapsed / this.animationConfig.duration, 1);

      // 应用缓动函数，实现easeInOut过渡效果
      lineProgress = this.animationConfig.easingFunction(lineProgress);

      // 应用动画，使用easeInOut进度
      line.el.y = originalY + (targetY - originalY) * lineProgress;

      // 应用缩放动画（与位置动画同步）
      if (this.currentScale[index] !== undefined && this.targetScale[index] !== undefined) {
        // 使用targetScale数组中的目标缩放值，确保高亮行复原时也有平滑过渡
        const targetScale = this.targetScale[index];
        // 使用与位置动画相同的进度来同步缩放动画
        this.currentScale[index] = this.currentScale[index] + (targetScale - this.currentScale[index]) * lineProgress;
        line.el.scale.set(this.currentScale[index]);
      }
    });

    // 更新可见行的遮罩状态
    this.updateVisibleLinesMask();

    // 动画结束条件：当整体进度达到100%时结束动画
    if (overallProgress >= 1) {
      // 移除动画
      Ticker.shared.remove(this.animateScroll, this);
      this.isScrolling = false;

      // 确保所有行都精确到达最终位置
      this.lines.forEach((line, index) => {
        const targetY = this.targetPositions[index]?.y ?? this.calculateTargetY(index, this.targetLineIndex);
        line.el.y = targetY;

        // 确保缩放也到达最终值 - 注释掉这部分代码，让系统继续使用update方法中的平滑插值
        // if (this.currentScale[index] !== undefined) {
        //   const targetScale = (index === this.targetLineIndex) ? this.HIGHLIGHT_SCALE : this.NORMAL_SCALE;
        //   this.currentScale[index] = targetScale;
        //   line.el.scale.set(this.currentScale[index]);
        // }
      });

      // 最后再次更新遮罩状态
      this.updateVisibleLinesMask();
    }
  }

  /**
   * 检查行是否在可视区域内
   */
  private isLineVisible(line: Line): boolean {
    // 获取行的边界
    const lineTop = line.el.y;
    const lineBottom = line.el.y + line.el.height;

    // 检查行是否在可视区域内
    return lineBottom > 0 && lineTop < this.viewHeight;
  }

  /**
   * 检查行的可见性是否发生变化
   */
  private hasLineVisibilityChanged(line: Line): boolean {
    const currentVisibility = this.isLineVisible(line);
    const previousVisibility = line.visible;

    // 如果之前没有记录过该行的可见性，或者可见性发生了变化
    return previousVisibility === undefined || previousVisibility !== currentVisibility;
  }

  /**
   * 更新行的可见性状态记录
   */
  private updateLineVisibilityRecord(line: Line): void {
    const visibility = this.isLineVisible(line);
    line.visible = visibility;
  }

  /**
   * 更新可见行的遮罩状态
   */
  private updateVisibleLinesMask() {
    this.lines.forEach((line) => {
      // 只有当行的可见性发生变化时才更新遮罩
      if (this.hasLineVisibilityChanged(line)) {
        if (this.isLineVisible(line)) {
          // 行可见，设置遮罩
          line.el.updateMask();
        } else {
          // 行不可见，移除遮罩
          line.el.removeMask();
        }
        // 更新行的可见性状态记录
        this.updateLineVisibilityRecord(line);
      }
    });
  }

  /**
   * 触发缩放动画
   */
  private triggerScaleAnimation() {
    // 如果正在滚动，不需要额外触发动画，因为滚动动画会处理缩放
    if (this.isScrolling) {
      return;
    }

    // 启动一个简单的缩放动画
    const startTime = Date.now();
    const duration = this.animationConfig.duration;

    // 保存开始时的缩放值，用于动画计算
    const startScales = [...this.currentScale];

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 应用缓动函数
      const easedProgress = this.animationConfig.easingFunction(progress);

      // 更新所有行的缩放
      for (let i = 0; i < this.currentScale.length; i++) {
        this.currentScale[i] = startScales[i] +
          (this.targetScale[i] - startScales[i]) * easedProgress;

        // 应用缩放到歌词行
        if (this.lines[i]) {
          this.lines[i].el.scale.set(this.currentScale[i]);
        }
      }

      // 如果动画未完成，继续下一帧
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    // 启动动画
    animate();
  }

  /**
   * 更新可见行（已移除动态添加/移除逻辑，所有行始终在画布中）
   */
  private updateVisibleLines() {
    // 此方法现在为空，因为所有行始终在画布中
    // 保留方法签名以保持代码兼容性
    // 调用遮罩更新方法
    this.updateVisibleLinesMask();
  }



  destroy() {
    // 停止滚动动画
    if (this.isScrolling) {
      Ticker.shared.remove(this.animateScroll, this);
      this.isScrolling = false;
    }

    // 移除帧率更新
    Ticker.shared.remove(this.updateFps, this);

    window.removeEventListener('resize', this.debouncedResize);
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe();
    }

    // 清理帧率显示相关资源
    if (this.fpsText) {
      this.fpsText.destroy();
      this.fpsText = null;
    }

    this.app.destroy();
  }
}

// 统计元素
function CountEl(lines: Line[]) {
  let containerNum = 0;
  let graphicsAndSpriteNum = 0;
  lines.forEach((line) => {
    if (line instanceof PreciseLyricLine) {
      containerNum += line.words.length + 1;
      graphicsAndSpriteNum += line.words.length;
    } else {
      containerNum += 1;
      graphicsAndSpriteNum += 1;
    }
  });

  console.log(
    'container: %d; graphics: %d; text: %d; total: %d',
    containerNum,
    graphicsAndSpriteNum,
    graphicsAndSpriteNum,
    containerNum + graphicsAndSpriteNum * 2
  );
}
