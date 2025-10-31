import {
  Application,
  Text,
  Container,
  Graphics,
  Sprite,
  RenderTexture,
} from 'pixi.js';
import { debounce, clamp, fill } from 'lodash-es';
import type { LyricLine } from './parseLyric';

interface LyricCanvasOptions {
  canvas: HTMLCanvasElement;
  renderer?: LyricRendererCore;
}

interface CharPosition {
  x: number;
  y: number;
  width: number;
  lineIndex: number;
  char: string;
}

interface PixiLyricLine {
  line: LyricLine;
  mask: Sprite;
  highlightGraphics: Graphics;
  normalGraphics: Graphics;
  rect: Rect[];
  container: Container;
  charWidths: CharPosition[];
  targetY?: number;
  animationStartTime?: number;
  animationDuration?: number;
  textObject?: Text;
  translateTextObject?: Text;
  totalHeight: number;
  availableWidth: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
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

const darkModeStyle = {
  normal: {
    color: 0xffffff,
    alpha: 0.6,
  },
  highlight: {
    color: 0xffffff,
    alpha: 1,
  },
};
const lightModeStyle = {
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
function manualWordWrap(text: string, maxWidth: number, fontSize = 20) {
  const chars = text.split('');
  let result = '';
  let line = '';
  const tempText = new Text({ text: '', style: { fontSize } });

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    tempText.text = line + char;
    if (tempText.width > maxWidth) {
      result += line + '\n';
      line = char;
    } else {
      line += char;
    }
  }

  result += line;
  return result;
}

export class LyricRendererCore {
  canvas: HTMLCanvasElement;
  whenReady: Promise<void>;
  app: Application;
  currentLineIndex: number = -1;
  currentWordIndex: number = -1;
  lineHeight: number = 60;
  fontSize: number = 28;
  lineGap: number = 24;
  lines: PixiLyricLine[] = [];
  private style = lightModeStyle;
  private currentTime: number = 0;
  private currentLyricData: LyricLine[] = [];
  private themeUnsubscribe: (() => void) | null = null;

  private animationConfig: AnimationConfig = {
    duration: 1600,
    delayPerLine: 60,
    easingFunction: EasingFunctions.easeInOut,
  };

  private debouncedResize = debounce(() => this.onResize(), 250);

  constructor(options: LyricCanvasOptions) {
    this.canvas = options.canvas;
    this.app = new Application();
    this.whenReady = this.init();
  }

  private async init() {
    // 获取canvas尺寸
    await this.app.init({
      canvas: this.canvas,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      powerPreference: 'low-power',
      backgroundAlpha: 0,
      resizeTo: this.canvas.parentElement || window, // 添加自动调整尺寸配置
    });
    this.themeUnsubscribe = createThemeListener(isDark => {
      this.onThemeChange(isDark);
    });
    window.addEventListener('resize', this.debouncedResize);
    this.app.ticker.add(() => this.animateScroll());
  }

  /**
   * 创建歌词
   */
  private async createLyric(lyric: LyricLine[]) {
    await this.whenReady;

    this.currentLyricData = lyric;
    this.app.stage.removeChildren();
    this.lines = [];

    let y = 0;
    const availableWidth = (this.app.renderer.width - 40) | 0;

    // 将歌词创建过程分批处理，避免阻塞UI
    await this.processLyricsInBatches(lyric, availableWidth, y);

    console.log(this.lines);

    if (this.lines.length > 0) {
      this.scrollToCenter(0);
    }
  }

  /**
   * 分批处理歌词创建以避免阻塞UI
   */
  private async processLyricsInBatches(
    lyric: LyricLine[],
    availableWidth: number,
    startY: number
  ): Promise<void> {
    return new Promise(resolve => {
      let index = 0;
      let y = startY;

      const processBatch = () => {
        const batchSize = 5; // 每批处理5行歌词
        const batchEnd = Math.min(index + batchSize, lyric.length);

        for (; index < batchEnd; index++) {
          const lineData = lyric[index];
          this.processSingleLyricLine(lineData, availableWidth, y);
          y += this.lines[this.lines.length - 1].totalHeight + this.lineGap;
        }

        if (index < lyric.length) {
          // 继续处理下一批，让出控制权给UI线程
          setTimeout(processBatch, 0);
        } else {
          resolve();
        }
      };

      processBatch();
    });
  }

  /**
   * 处理单行歌词的创建
   */
  private processSingleLyricLine(
    lineData: LyricLine,
    availableWidth: number,
    y: number
  ) {
    const lineContainer = new Container();
    // 修改调用方式，传递整个lineData而不是仅text
    const charPositions = this.calculateCharPositionsWithPixiSync(
      lineData,
      availableWidth
    );

    const text = new Text({
      text: lineData.text,
      style: {
        fill: 0xffffff,
        fontSize: this.fontSize,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: availableWidth,
        breakWords: true,
        lineHeight: this.fontSize * 1.2,
      },
    });

    const renderTexture = RenderTexture.create({
      width: Math.ceil(text.width),
      height: Math.ceil(text.height),
      resolution: this.app.renderer.resolution,
    });

    this.app.renderer.render({
      container: text,
      target: renderTexture,
    });

    const mask = new Sprite(renderTexture);
    const highlightGraphics = new Graphics();
    const normalGraphics = new Graphics();

    normalGraphics.rect(0, 0, text.width, text.height);
    normalGraphics.fill({ ...this.style.normal });

    highlightGraphics.fill({ ...this.style.highlight });

    lineContainer.x = 20;
    lineContainer.y = y;
    lineContainer.addChild(normalGraphics, highlightGraphics, mask);

    highlightGraphics.mask = mask;
    normalGraphics.mask = mask;

    const textHeight = text.height;
    let translateTextHeight = 0;
    let translateText: Text | undefined;

    if (lineData.translateText) {
      const fontSize = this.fontSize * 0.6;
      translateText = new Text({
        text: manualWordWrap(lineData.translateText, availableWidth, fontSize),
        style: {
          fill: this.style.normal.color,
          fontSize,
          // wordWrap: true,
          // wordWrapWidth: availableWidth,
          // breakWords: true,
        },
      });
      translateText.alpha = this.style.normal.alpha;

      translateText.y = textHeight + 5;
      lineContainer.addChild(translateText);
      translateTextHeight = translateText.height;
    }

    const totalHeight =
      textHeight + (lineData.translateText ? translateTextHeight + 5 : 0);

    const usedLineHeight = Math.max(totalHeight, this.lineHeight);
    const lineTotalHeight = usedLineHeight;

    this.app.stage.addChild(lineContainer);

    this.lines.push({
      container: lineContainer,
      mask: mask,
      highlightGraphics,
      normalGraphics,
      line: lineData,
      rect: [
        {
          x: 0,
          y: 0,
          width: text.width,
          height: text.height,
        },
      ],
      charWidths: charPositions,
      textObject: text,
      translateTextObject: translateText,
      totalHeight: lineTotalHeight,
      availableWidth: availableWidth,
    });

    text.destroy();
  }

  /**
   * 同步版本的字符位置计算
   */
  private calculateCharPositionsWithPixiSync(
    lineData: LyricLine,
    availableWidth: number
  ): CharPosition[] {
    // 如果没有子元素，直接返回空数组
    if (!lineData.children || lineData.children.length === 0) {
      return [];
    }

    const charPositions: CharPosition[] = [];
    let currentX = 0;
    let currentY = 0;
    let lineIndex = 0;

    // 如果是逐字歌词，基于children计算字符位置
    let charIndex = 0;
    lineData.children?.forEach(word => {
      const char = word.text;
      const charText = new Text({
        text: char,
        style: {
          fill: 0xffffff,
          fontSize: this.fontSize,
          fontWeight: 'bold',
          lineHeight: this.fontSize * 1.2,
        },
      });

      const charWidth = charText.width;
      // 检查是否需要换行

      if (currentX + charWidth >= availableWidth && currentX > 0) {
        currentX = 0;
        currentY += this.fontSize * 1.2;
        lineIndex++;
      }

      charPositions.push({
        x: currentX,
        y: currentY,
        width: charWidth,
        lineIndex: lineIndex,
        char: char,
      });

      currentX += charWidth;
      charText.destroy();
      charIndex++;
    });

    return charPositions;
  }

  /**
   * 使用PIXI文本测量字符位置
   * 为逐字歌词计算每个字符的精确位置
   * @param lineData - 歌词行数据
   * @param availableWidth - 可用宽度
   * @returns 字符位置信息数组
   */
  private async calculateCharPositionsWithPixi(
    lineData: LyricLine,
    availableWidth: number
  ): Promise<CharPosition[]> {
    // 如果没有子元素，直接返回空数组
    if (!lineData.children || lineData.children.length === 0) {
      return [];
    }

    const charPositions: CharPosition[] = [];
    const tempContainer = new Container();
    this.app.stage.addChild(tempContainer);

    try {
      let currentX = 0;
      let currentY = 0;
      let lineIndex = 0;

      // 如果是逐字歌词，基于children计算字符位置
      let charIndex = 0;
      lineData.children?.forEach(word => {
        const char = word.text;
        const charText = new Text({
          text: char,
          style: {
            fill: 0xffffff,
            fontSize: this.fontSize,
            fontWeight: 'bold',
          },
        });

        const charWidth = charText.width;

        // 检查是否需要换行
        if (currentX + charWidth > availableWidth && currentX > 0) {
          currentX = 0;
          currentY += this.fontSize * 1.2;
          lineIndex++;
        }

        charPositions.push({
          x: currentX,
          y: currentY,
          width: charWidth,
          lineIndex: lineIndex,
          char: char,
        });

        currentX += charWidth;
        charText.destroy();
        charIndex++;
      });
      // 对于非逐字歌词，不需要计算每个字符的位置，因为会整行高亮显示
    } finally {
      this.app.stage.removeChild(tempContainer);
      tempContainer.destroy();
    }

    return charPositions;
  }

  /**
   * 更新当前时间点的歌词高亮显示
   * 根据当前播放时间计算需要高亮的歌词部分，并更新UI
   */
  private updateHighlight() {
    if (this.currentLineIndex < 0 || this.currentLineIndex >= this.lines.length)
      return;

    const line = this.lines[this.currentLineIndex];
    const lineData = line.line;
    const words = lineData.children;

    line.highlightGraphics.clear();

    // 如果不是逐字歌词，直接高亮整行
    if (!words || words.length === 0) {
      line.highlightGraphics.rect(0, 0, line.mask.width, line.mask.height);
      line.highlightGraphics.fill({ ...this.style.highlight });
      return;
    }

    const lineElapsedTime = this.currentTime - lineData.time;

    // 计算整行的总时长
    const totalLineDuration = words.reduce(
      (sum, word) => sum + word.duration,
      0
    );

    // 如果当前时间超过整行时间，高亮所有字符
    if (lineElapsedTime >= totalLineDuration) {
      this.highlightAllChars(line);
      return;
    }

    // 如果当前时间在行开始之前，不高亮任何字符
    if (lineElapsedTime < 0) {
      return;
    }

    // 重新计算字符高亮进度
    const charProgress = this.calculateCharProgress(lineData, lineElapsedTime);

    // 使用计算出的进度绘制高亮效果
    this.drawHighlightWithProgress(line, charProgress);
  }

  /**
   * 计算每个字符的高亮进度
   * @param lineData - 歌词行数据
   * @param lineElapsedTime - 当前行已播放时间
   * @returns 每个字符的高亮进度数组（0.0-1.0）
   */
  private calculateCharProgress(
    lineData: LyricLine,
    lineElapsedTime: number
  ): number[] {
    const words = lineData.children;
    if (!words || words.length === 0) return [];

    let accumulatedTime = 0;
    const charProgress: number[] = [];

    // 为每个字符计算进度
    words.forEach(word => {
      const wordStart = accumulatedTime;
      const wordEnd = wordStart + word.duration;

      // 为当前字符计算进度
      let progress = 0;
      if (lineElapsedTime >= wordEnd) {
        progress = 1; // 字符完全高亮
      } else if (lineElapsedTime > wordStart) {
        progress = (lineElapsedTime - wordStart) / word.duration;
        progress = clamp(progress, 0, 1);
      }

      charProgress.push(progress);
      accumulatedTime += word.duration;
    });

    return charProgress;
  }

  /**
   * 根据字符进度绘制高亮效果
   * 按行分组处理字符，确保正确处理换行情况
   * @param line - 歌词行对象
   * @param charProgress - 每个字符的高亮进度数组
   */
  private drawHighlightWithProgress(
    line: PixiLyricLine,
    charProgress: number[]
  ) {
    line.highlightGraphics.clear();

    // 按行分组字符
    const charsByLine = this.groupCharsByLine(line.charWidths);

    // 处理每一行的高亮
    Object.keys(charsByLine).forEach(lineIndexStr => {
      const lineIndex = parseInt(lineIndexStr);
      const lineChars = charsByLine[lineIndex];

      if (lineChars.length === 0) return;

      // 查找这一行中需要高亮的字符段
      let segmentStart = -1;

      for (let i = 0; i <= lineChars.length; i++) {
        const currentChar = i < lineChars.length ? lineChars[i] : null;
        const currentProgress = currentChar
          ? charProgress[currentChar.globalIndex]
          : 0;

        if (currentProgress > 0 && segmentStart === -1) {
          // 开始新的高亮段
          segmentStart = i;
        } else if (
          segmentStart !== -1 &&
          (!currentChar || currentProgress === 0)
        ) {
          // 结束当前高亮段并绘制
          this.drawHighlightSegment(
            line,
            lineChars,
            segmentStart,
            i - 1,
            charProgress
          );
          segmentStart = -1;
        }
      }
    });

    line.highlightGraphics.fill({ ...this.style.highlight });
  }

  /**
   * 绘制连续字符的高亮段
   * 处理部分高亮字符的精确位置计算
   * @param line - 歌词行对象
   * @param lineChars - 当前行的字符位置信息
   * @param startIndex - 高亮段起始字符索引
   * @param endIndex - 高亮段结束字符索引
   * @param charProgress - 每个字符的高亮进度数组
   */
  private drawHighlightSegment(
    line: PixiLyricLine,
    lineChars: { charPos: CharPosition; globalIndex: number }[],
    startIndex: number,
    endIndex: number,
    charProgress: number[]
  ) {
    if (
      startIndex < 0 ||
      endIndex >= lineChars.length ||
      startIndex > endIndex
    ) {
      return;
    }

    const startChar = lineChars[startIndex];
    const endChar = lineChars[endIndex];

    // 计算开始字符的部分高亮
    const startProgress = charProgress[startChar.globalIndex];
    let startX = startChar.charPos.x;
    if (startProgress > 0 && startProgress < 1) {
      // 从字符的起始位置开始高亮，而不是从右侧开始
      startX = startChar.charPos.x;
    }

    // 计算结束字符的部分高亮
    const endProgress = charProgress[endChar.globalIndex];
    let endX = endChar.charPos.x + endChar.charPos.width;
    if (endProgress > 0 && endProgress < 1) {
      endX = endChar.charPos.x + endChar.charPos.width * endProgress;
    }

    // 确保宽度至少为1像素
    const highlightWidth = Math.max(endX - startX, 1);
    const highlightX = startX;

    line.highlightGraphics.rect(
      highlightX,
      startChar.charPos.y,
      highlightWidth,
      this.fontSize * 1.2
    );
  }

  /**
   * 高亮所有字符
   */
  private highlightAllChars(line: PixiLyricLine) {
    line.highlightGraphics.clear();

    // 按行分组字符
    const charsByLine = this.groupCharsByLine(line.charWidths);

    // 为每一行绘制完整的高亮区域
    Object.keys(charsByLine).forEach(lineIndexStr => {
      const lineIndex = parseInt(lineIndexStr);
      const lineChars = charsByLine[lineIndex];

      if (lineChars.length === 0) return;

      const firstChar = lineChars[0].charPos;
      const lastChar = lineChars[lineChars.length - 1].charPos;

      const highlightWidth = lastChar.x + lastChar.width - firstChar.x;

      line.highlightGraphics.rect(
        firstChar.x,
        firstChar.y,
        highlightWidth,
        this.fontSize * 1.2
      );
    });

    line.highlightGraphics.fill({ ...this.style.highlight });
  }

  /**
   * 按行分组字符位置信息
   * 将连续的字符按换行位置分组，便于逐行处理高亮
   * @param charWidths - 字符位置信息数组
   * @returns 按行索引分组的字符对象
   */
  private groupCharsByLine(charWidths: CharPosition[]): {
    [lineIndex: number]: { charPos: CharPosition; globalIndex: number }[];
  } {
    const charsByLine: {
      [lineIndex: number]: { charPos: CharPosition; globalIndex: number }[];
    } = {};

    charWidths.forEach((charPos, globalIndex) => {
      if (!charsByLine[charPos.lineIndex]) {
        charsByLine[charPos.lineIndex] = [];
      }
      charsByLine[charPos.lineIndex].push({ charPos, globalIndex });
    });

    return charsByLine;
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
      this.createLyric(this.currentLyricData);

      if (this.currentLineIndex >= 0) {
        this.setCurrentTime(this.currentTime);
      }
    }
  }

  /**
   *
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

  setLyric(lyric: LyricLine[]) {
    this.createLyric(lyric);
  }

  setCurrentTime(millisecond: number = 0) {
    this.currentTime = millisecond;
    this.update();
  }

  update() {
    if (!this.lines.length) return;

    let targetLineIndex = 0;
    for (let i = 0; i < this.lines.length; i++) {
      const nextLineTime =
        i + 1 < this.lines.length ? this.lines[i + 1].line.time : Infinity;
      if (
        this.lines[i].line.time <= this.currentTime &&
        this.currentTime < nextLineTime
      ) {
        targetLineIndex = i;
        break;
      } else if (this.lines[i].line.time <= this.currentTime) {
        targetLineIndex = i;
      }
    }

    if (targetLineIndex !== this.currentLineIndex) {
      if (
        this.currentLineIndex >= 0 &&
        this.currentLineIndex < this.lines.length
      ) {
        const prevLine = this.lines[this.currentLineIndex];
        prevLine.highlightGraphics.clear();
      }

      const previousLineIndex = this.currentLineIndex;
      this.currentLineIndex = targetLineIndex;

      if (previousLineIndex !== -1) {
        this.scrollToCenterWithAnimation(targetLineIndex, previousLineIndex);
      } else {
        this.scrollToCenter(targetLineIndex);
      }
    }

    this.updateHighlight();
  }

  /**
   * 带动画效果的滚动到指定行
   * @param lineIndex - 目标行索引
   * @param previousLineIndex - 上一个行索引
   */
  private scrollToCenterWithAnimation(
    lineIndex: number,
    previousLineIndex: number
  ) {
    if (!this.lines.length || !this.app.renderer) return;

    const targetLine = this.lines[lineIndex];
    if (!targetLine) return;

    const centerY = this.app.renderer.height / 2;

    let cumulativeHeight = 0;
    for (let i = 0; i < lineIndex; i++) {
      cumulativeHeight += this.lines[i].totalHeight + this.lineGap;
    }

    const targetY = centerY - targetLine.totalHeight / 2 - cumulativeHeight;

    const influenceRange = Math.min(8, Math.floor(this.lines.length / 2));

    let currentY = 0;
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];

      if (i === 0) {
        currentY = targetY;
      } else {
        currentY += this.lines[i - 1].totalHeight + this.lineGap;
      }

      line.targetY = currentY;

      const distance = Math.abs(i - lineIndex);
      let delay = 0;
      let duration = this.animationConfig.duration;

      if (
        (lineIndex > previousLineIndex && i < lineIndex) ||
        (lineIndex < previousLineIndex && i > lineIndex)
      ) {
        delay = 0;
        duration = this.animationConfig.duration * 0.8;
      } else if (distance <= influenceRange) {
        delay = distance * this.animationConfig.delayPerLine;
        duration = this.animationConfig.duration * (1 - distance * 0.03);
      } else {
        delay = 0;
        duration = this.animationConfig.duration * 0.8;
      }

      line.animationStartTime = performance.now() + delay;
      line.animationDuration = duration;
    }
  }

  /**
   * 动画帧处理函数
   * 更新滚动动画状态
   */
  private animateScroll() {
    if (!this.lines.length || !this.app.renderer) return;

    const now = performance.now();
    let isAnimating = false;

    this.lines.forEach(line => {
      if (line.targetY !== undefined && line.animationStartTime !== undefined) {
        if (now >= line.animationStartTime!) {
          const elapsed = now - line.animationStartTime!;
          const duration =
            line.animationDuration || this.animationConfig.duration;

          if (elapsed < duration) {
            isAnimating = true;
            const progress = elapsed / duration;
            const easeProgress = this.animationConfig.easingFunction(progress);

            const currentY = line.container.y;
            const targetY = line.targetY!;
            line.container.y = currentY + (targetY - currentY) * easeProgress;
          } else {
            line.container.y = line.targetY!;
            line.targetY = undefined;
            line.animationStartTime = undefined;
            line.animationDuration = undefined;
          }
        } else {
          isAnimating = true;
        }
      }
    });

    if (!isAnimating) {
      this.lines.forEach(line => {
        if (line.targetY !== undefined) {
          line.container.y = line.targetY;
        }
      });
    }
  }

  /**
   * 静态滚动到指定行
   * 无动画效果的立即滚动
   * @param lineIndex - 目标行索引
   */
  private scrollToCenter(lineIndex: number) {
    if (!this.lines.length || !this.app.renderer) return;

    const targetLine = this.lines[lineIndex];
    if (!targetLine) return;

    const centerY = this.app.renderer.height / 2;

    let cumulativeHeight = 0;
    for (let i = 0; i < lineIndex; i++) {
      cumulativeHeight += this.lines[i].totalHeight + this.lineGap;
    }

    const targetY = centerY - targetLine.totalHeight / 2 - cumulativeHeight;

    let currentY = targetY;
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].container.y = currentY;
      currentY += this.lines[i].totalHeight + this.lineGap;
    }
  }

  destroy() {
    this.debouncedResize.cancel();
    window.removeEventListener('resize', this.debouncedResize);
    this.app.destroy(true, {
      children: true,
      texture: true,
    });
  }
}

export class LyricRenderer {
  renderer: LyricRendererCore;

  constructor(options: LyricCanvasOptions) {
    this.renderer = options.renderer || new LyricRendererCore(options);
  }

  setLyric(lyric: LyricLine[]) {
    this.renderer.setLyric(lyric);
  }

  setCurrentTime(millisecond: number = 0) {
    this.renderer.setCurrentTime(millisecond);
  }

  update() {
    this.renderer.update();
  }

  onResize() {
    this.renderer.onResize();
  }

  getLyric() {
    return this.renderer.getLyric();
  }

  destroy() {
    this.renderer.destroy();
  }
}
