import { Application, Ticker } from 'pixi.js';
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
    alpha: 0.6,
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
    alpha: 0.6,
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

type Line = NormalLyricLine | PreciseLyricLine;

// 歌词渲染器
export class LyricRenderer {
  canvas: HTMLCanvasElement;
  app: Application;
  // 初始化标志
  private initialized: Promise<void> | null = null;
  currentLineIndex: number = -1;
  currentWordIndex: number = -1;
  lineHeight: number = 60;
  fontSize: number = 28;
  lineGap: number = 24;
  lines: Line[] = [];
  private style = lightModeStyle;
  private currentTime: number = 0;
  private currentLyricData: LyricLine[] = [];
  private themeUnsubscribe: (() => void) | null = null;

  private viewHeight: number = 0;
  private viewWidth: number = 0;

  // 平滑滚动相关属性
  private isScrolling: boolean = false;
  private scrollStartTime: number = 0;
  private scrollDuration: number = 500; // 滚动动画持续时间（毫秒）
  private originalPositions: { y: number }[] = [];
  private targetPositions: { y: number }[] = [];

  private animationConfig: AnimationConfig = {
    duration: 1600,
    delayPerLine: 60,
    easingFunction: EasingFunctions.easeInOut,
  };

  private debouncedResize = debounce(() => this.onResize(), 250);

  constructor(options: LyricCanvasOptions) {
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
      powerPreference: 'low-power',
      // backgroundAlpha: 0,
      resizeTo: this.canvas.parentElement || window, // 添加自动调整尺寸配置
    });
    this.themeUnsubscribe = createThemeListener(isDark => {
      this.onThemeChange(isDark);
    });
    window.addEventListener('resize', this.debouncedResize);
  }

  private async whenReady() {
    await this.initialized;
  }

  /**
   * 创建歌词
   * todo：优化性能
   */

  private async createLyric(lyric: LyricLine[]) {
    console.time('createLyric');
    await this.whenReady();

    // 可用宽度 left 10;right 10
    const availableWidth = this.viewWidth - 20;
    console.log(availableWidth);

    this.app.stage.removeChildren();

    this.lines.forEach(line => line.destroy());
    this.lines = [];

    for (let index = 0; index < lyric.length; index++) {
      const line = lyric[index];
      const lyricLine = this.createLyricLine(line, availableWidth);

      if (index === 0) {
        // 第一行位于屏幕中间
        lyricLine.y = this.viewHeight / 2 - lyricLine.height / 2;
      } else {
        // 后续行基于前一行位置
        const prevLine = this.lines[index - 1];
        lyricLine.y = prevLine.y + prevLine.height + this.lineGap;
      }

      console.log(
        'index: %d; y: %f; height: %f',
        index,
        lyricLine.y,
        lyricLine.height
      );

      lyricLine.x = 10;

      this.lines.push(lyricLine);

      this.app.stage.addChild(lyricLine);
    }

    console.timeEnd('createLyric');
    console.log(this);
    //统计 test

    CountEl(this.lines);
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
   * 处理窗口大小变化
   * 重新计算歌词布局并更新UI
   */
  onResize() {
    if (this.app.renderer && this.currentLyricData.length > 0) {
      // 重新设置渲染器尺寸
      this.app.renderer.resize(
        this.canvas.clientWidth,
        this.canvas.clientHeight
      );
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
    this.currentLyricData = lyric;
    this.createLyric(lyric);
  }

  /**
   * 设置播放进度
   * @param millisecond 毫秒
   */
  setCurrentTime(millisecond: number = 0) {
    this.currentTime = millisecond;
    this.updateLyricHighlight();
  }

  /**
   * 更新歌词高亮
   */
  private updateLyricHighlight() {
    if (this.currentLyricData.length === 0) return;

    // 找到当前应该高亮的歌词行
    let newLineIndex = -1;
    for (let i = 0; i < this.currentLyricData.length; i++) {
      const line = this.currentLyricData[i];
      const nextLine = this.currentLyricData[i + 1];

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

    // 如果找到了新的高亮行，或者取消高亮
    if (newLineIndex !== this.currentLineIndex) {
      // 取消之前高亮的行
      if (
        this.currentLineIndex >= 0 &&
        this.currentLineIndex < this.lines.length
      ) {
        const prevLine = this.lines[this.currentLineIndex];
        prevLine.clearHighlight();
      }

      // 高亮新的行
      if (newLineIndex >= 0 && newLineIndex < this.lines.length) {
        const currentLine = this.lines[newLineIndex];
        // 如果是普通歌词行，直接高亮整行
        if (currentLine instanceof NormalLyricLine) {
          currentLine.highlight(1);
        }
        this.scrollTo(newLineIndex);
      }

      this.currentLineIndex = newLineIndex;
    }

    // 如果是逐字歌词行，需要更新字符级别的高亮
    if (newLineIndex >= 0 && newLineIndex < this.lines.length) {
      const currentLineData = this.currentLyricData[newLineIndex];
      const currentLineEl = this.lines[newLineIndex];

      // 检查是否为逐字歌词
      if (
        currentLineData.children &&
        currentLineData.children.length > 0 &&
        currentLineEl instanceof PreciseLyricLine
      ) {
        // 计算当前应该高亮到哪个字符
        let wordIndex = -1;
        let progress = 0;

        // 查找当前时间对应的字符
        for (let i = 0; i < currentLineData.children.length; i++) {
          const child = currentLineData.children[i];
          if (
            this.currentTime >= child.time &&
            this.currentTime < child.time + child.duration
          ) {
            wordIndex = i;
            // 计算在当前字符内的进度 (0-1)
            progress = (this.currentTime - child.time) / child.duration;
            break;
          } else if (this.currentTime >= child.time + child.duration) {
            // 当前时间已经过了这个字符
            wordIndex = i;
            progress = 1;
          }
        }

        // 如果找到了对应的字符，则更新高亮
        if (wordIndex >= 0) {
          currentLineEl.highlight(progress, wordIndex);
        } else if (currentLineData.children.length > 0) {
          // 如果时间已经超过所有字符，则高亮整行
          currentLineEl.highlight(1, currentLineData.children.length - 1);
        }
      }
    }
  }

  /**
   * 平滑滚动到指定行，使其位于垂直方向中间
   */
  private scrollTo(index: number) {
    if (index < 0 || index >= this.lines.length) return;

    // 如果正在滚动，先停止当前滚动
    if (this.isScrolling) {
      Ticker.shared.remove(this.animateScroll, this);
      this.isScrolling = false;
    }

    const targetLine = this.lines[index];
    const screenHeight = this.app.screen.height;

    // 保存当前位置
    this.originalPositions = this.lines.map(line => ({ y: line.y }));

    // 计算目标位置
    this.targetPositions = [];

    // 先计算目标行之前所有行的总高度
    let preLinesHeight = 0;
    for (let i = 0; i < index; i++) {
      preLinesHeight += this.lines[i].height + this.lineGap;
    }

    // 计算目标行应该位于屏幕中间时的起始Y坐标
    const targetLineCenterY = screenHeight / 2;
    const targetLineTopY = targetLineCenterY - targetLine.height / 2;

    // 计算需要滚动的距离
    const scrollOffset = targetLineTopY - preLinesHeight;

    // 计算目标位置
    this.lines.forEach((line, i) => {
      if (i === 0) {
        this.targetPositions.push({ y: scrollOffset });
      } else {
        const prevTargetY = this.targetPositions[i - 1].y;
        this.targetPositions.push({
          y: prevTargetY + this.lines[i - 1].height + this.lineGap,
        });
      }
    });

    // 开始平滑滚动动画
    this.startSmoothScroll();
  }

  /**
   * 开始平滑滚动动画
   */
  private startSmoothScroll() {
    this.isScrolling = true;
    this.scrollStartTime = performance.now();

    // 使用Pixi.js的Ticker进行动画
    Ticker.shared.add(this.animateScroll, this);
  }

  /**
   * 平滑滚动动画
   */
  private animateScroll() {
    const currentTime = performance.now();
    const elapsed = currentTime - this.scrollStartTime;
    const progress = Math.min(elapsed / this.scrollDuration, 1);

    // 使用缓动函数使动画更平滑
    const easedProgress = this.easeOutCubic(progress);

    // 更新所有行的位置
    this.lines.forEach((line, i) => {
      const startY = this.originalPositions[i].y;
      const targetY = this.targetPositions[i].y;
      line.y = startY + (targetY - startY) * easedProgress;
    });

    // 动画完成
    if (progress >= 1) {
      Ticker.shared.remove(this.animateScroll, this);
      this.isScrolling = false;
    }
  }

  /**
   * 缓动函数：easeOutCubic
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  destroy() {
    // 停止滚动动画
    if (this.isScrolling) {
      Ticker.shared.remove(this.animateScroll, this);
      this.isScrolling = false;
    }

    window.removeEventListener('resize', this.debouncedResize);
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe();
    }
    this.app.destroy();
  }
}

// 统计元素
function CountEl(lines: Line[]) {
  let containerNum = 0;
  let graphicsAndSpriteNum = 0;
  lines.forEach(line => {
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
