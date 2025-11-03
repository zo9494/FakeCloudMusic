import {
  Application,
  Text,
  Container,
  Graphics,
  Sprite,
  RenderTexture,
  type CanvasTextOptions,
  TextStyle,
  type Renderer,
} from 'pixi.js';
import { debounce, clamp, fill } from 'lodash-es';
import type { LyricLine, LyricLineChild } from './parseLyric';

interface LyricCanvasOptions {
  canvas: HTMLCanvasElement;
}

interface PixiLyricLine {
  //每行原数据
  line: LyricLine;
  // 每行容器
  container: Container;
  // 逐字歌词子项
  children: Child[];
  // 翻译行
  translateText?: Text;

  graphics: Graphics;
}

// 子项
interface Child {
  // 单个子原数据
  word: LyricLineChild;
  //  遮罩
  mask: Sprite;

  graphics: Graphics;
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
   */
  private async createLyric(lyric: LyricLine[]) {
    await this.whenReady();

    this.app.stage.removeChildren();
    this.lines = [];

    const availableWidth = (this.app.renderer.width - 40) | 0;

    let y = 10;

    for (let i = 0; i < 10; i++) {
      const line = lyric[i];
      const lyricLine = new PreciseLyricLine({
        line,
        app: this.app,
        maxWidth: availableWidth,
      });

      lyricLine.y = y;

      this.app.stage.addChild(lyricLine);
      // 递加y
      y += lyricLine.height + this.lineGap;

      // lyricLine.highlight(0.2, 1);
    }
    // lyric.forEach((line, index) => {
    //   const lyricLine = new NormalLyricLine({
    //     line,
    //     app: this.app,
    //   });

    //   lyricLine.y = y;

    //   this.app.stage.addChild(lyricLine);
    //   // 递加y
    //   y += lyricLine.height + this.lineGap;

    //   lyricLine.highlight();
    // });

    console.log('创建完成', this.app);
  }

  /**
   * 创建非逐字歌词行
   */
  private createNormalLine(
    lineContainer: Container,
    line: LyricLine,
    availableWidth: number
  ) {
    // 总高度
    let height = 0;
    // 文字转纹理
    const textTexture = this.app.renderer.canvasText.getTexture({
      text: line.text,
      style: {
        fill: 0xffffff,
        fontSize: this.fontSize,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: availableWidth,
      },
    });
    height += textTexture.height;
    // 创建遮罩
    const mask = new Sprite(textTexture);

    // 创建背景
    const graphics = new Graphics();
    // 绘制非高亮背景
    graphics
      .rect(0, 0, textTexture.width, textTexture.height)
      .fill({ ...this.style.normal });

    graphics.mask = mask;

    // 创建翻译行
    if (line.translateText) {
      const translateText = new Text({
        text: line.translateText,
        style: {
          fill: this.style.normal.color,
          fontSize: this.fontSize * 0.7,
          fontWeight: 'bold',
          wordWrap: true,
          wordWrapWidth: availableWidth,
          breakWords: true,
        },
      });

      height += translateText.height;
      translateText.alpha = this.style.normal.alpha;
      translateText.y = textTexture.height;
      lineContainer.addChild(translateText);
    }

    lineContainer.addChild(graphics, mask);
    return {
      // 高亮高度
      highlightHeight: textTexture.height,
      // 高亮宽度
      highlightWidth: textTexture.width,
      // 总高度
      height,
      width: lineContainer.width,
      graphics,
      mask,
    };
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

  update() {}

  destroy() {
    this.debouncedResize.cancel();
    window.removeEventListener('resize', this.debouncedResize);
    this.app.destroy(true, {
      children: true,
      texture: true,
    });
  }
}

abstract class BaseLyricLineWord {
  abstract app: Application;
  /**
   * 高亮歌词行 (1=完全高亮)
   * @param progress 0-1 歌词行高亮进度
   * @param index 歌词行要高亮的单词、字符的下标
   */
  abstract highlight(progress: number, index: number): void;
}

abstract class BaseLyricLine extends BaseLyricLineWord {
  abstract maxWidth: number;
  /**
   * 创建歌词
   */
  abstract createLyricLine(lyric: LyricLine, style: Partial<TextStyle>): void;
}

interface LyricLineOptions {
  app: Application;
  line: LyricLine;
  maxWidth: number;
}

interface LyricText {
  height: number;
  width: number;
  graphics: Graphics;
}
/**
 * 普通行带高亮歌词
 */
class NormalLyricLine extends Container implements BaseLyricLine {
  app: Application<Renderer>;
  word?: LyricText;
  maxWidth: number;
  constructor(options: LyricLineOptions) {
    super();
    this.app = options.app;
    this.maxWidth = options.maxWidth;
    this.createLyricLine(options.line);
  }

  createLyricLine(lyric: LyricLine, style?: Partial<TextStyle>) {
    const text = TextUtils.getTextWrap(
      lyric.text,
      {
        fontSize: 32,
        fontWeight: 'bold',
      },
      this.maxWidth
    ).join('\n'); //因为普通行是整体高亮，因此直接插入\n换行就行
    console.log('normalLine', text);

    // 用文字生成遮罩纹理
    const textTexture = this.app.renderer.canvasText.getTexture({
      text,
      style: {
        fill: 0xffffff,
        fontSize: 32,
        fontWeight: 'bold',
      },
    });

    const mask = new Sprite(textTexture);

    const graphics = new Graphics();
    graphics.rect(0, 0, mask.width, mask.height).fill({ color: 0xffffff });
    this.word = {
      height: mask.height,
      width: mask.width,
      graphics,
    };
    //
    graphics.mask = mask;
    this.addChild(graphics, mask);

    if (lyric.translateText) {
      // 因为翻译肯定都是中文，直接使用pixi的换行也满足要求
      const translateText = new Text({
        text: lyric.translateText,
        style: {
          fill: 0xffffff,
          fontSize: 24,
        },
      });

      translateText.y += mask.height;

      this.addChild(translateText);
    }
  }

  /**
   * 高亮
   */
  highlight(progress = 1): void {
    if (!this.word) {
      return;
    }
    // 普通行只接受0，1
    progress = progress | 0;
    const { graphics, width, height } = this.word;
    const highlightWidth = width * progress;
    graphics.clear();

    graphics
      .rect(0, 0, highlightWidth, height)
      .fill({
        color: 'red',
      })
      .rect(highlightWidth, 0, width - highlightWidth, height)
      .fill({
        color: 0xffffff,
      });
  }
}

class LyricLineWord extends Container implements BaseLyricLineWord {
  word?: LyricText;
  app: Application;
  constructor(app: Application, text: string) {
    super();
    this.app = app;
    this.createWord(text);
  }
  createWord(text: string) {
    // 用文字生成遮罩纹理
    const textTexture = this.app.renderer.canvasText.getTexture({
      text,
      style: {
        fill: 0xffffff,
        fontSize: 32,
        fontWeight: 'bold',
      },
    });

    const mask = new Sprite(textTexture);

    const graphics = new Graphics();
    graphics.rect(0, 0, mask.width, mask.height).fill({ color: 0xffffff });
    this.word = {
      height: mask.height,
      width: mask.width,
      graphics,
    };
    //
    graphics.mask = mask;
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
      .fill({
        color: 'red',
      })
      .rect(highlightWidth, 0, width - highlightWidth, height)
      .fill({
        color: 0xffffff,
      });
  }
}

/**
 * 逐字歌词行
 */
class PreciseLyricLine extends Container implements BaseLyricLine {
  app: Application<Renderer>;
  words: LyricLineWord[] = [];
  maxWidth: number;
  constructor(options: LyricLineOptions) {
    super();
    this.app = options.app;
    this.maxWidth = options.maxWidth;
    this.createLyricLine(options.line);
  }

  highlight(progress: number, index: number): void {
    throw new Error('Method not implemented.');
  }
  createLyricLine(lyric: LyricLine): void {
    if (lyric.children) {
      // 用于给主歌词定位
      let x = 0;
      let y = 0;
      let maxHeight = 0;
      // 主歌词的一整行的高
      let height = 0;
      lyric.children.forEach(word => {
        const char = new LyricLineWord(this.app, word.text);
        // 用当前最高的字符作为这行的高
        if (char.height > maxHeight) {
          maxHeight = char.height;
          height += maxHeight;
        }

        if (x >= this.maxWidth) {
          // 超过显示宽度，换行
          x = 0;
          y += maxHeight;
          maxHeight = 0;
        }

        char.x = x;
        x += char.width;
        char.y = y;

        this.words.push(char);
        this.addChild(char);
      });
      // 翻译行
      if (lyric.translateText) {
        const translateText = new Text({
          text: lyric.translateText,
          style: {
            fill: 0xffffff,
            fontSize: 24,
          },
        });
        translateText.y = height;
        this.addChild(translateText);
      }
    }
  }
}

// 文本工具类
class TextUtils {
  private static tempText: Text | null = null;

  /**
   * 获取文本宽度
   */
  static getTextWidth(text: string = '', style: Partial<TextStyle>): number {
    if (!TextUtils.tempText) {
      TextUtils.tempText = new Text({
        text,
        style,
      });
      TextUtils.tempText.visible = false;
    }

    TextUtils.tempText.text = text;
    return TextUtils.tempText.width;
  }

  /**
   * 获取换行后的文本（正确处理空格和英文单词）
   */
  static getTextWrap(
    text: string,
    style: Partial<TextStyle>,
    maxWidth: number
  ): string[] {
    const result: string[] = [];

    // 如果文本宽度小于最大宽度，直接返回
    if (this.getTextWidth(text, style) <= maxWidth) {
      return [text.trim()];
    }

    // 分割文本为片段，保持英文单词完整性（包括使用英文或中文撇号的单词）
    const segments = this.splitTextIntoSegments(text);
    let currentLine = '';

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // 如果当前行为空且片段是空格，跳过这个空格（避免行首空格）
      if (currentLine === '' && this.isWhitespace(segment)) {
        continue;
      }

      // 测试行：当前行 + 当前片段
      const testLine = currentLine + segment;
      const testWidth = this.getTextWidth(testLine, style);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        // 需要换行
        if (currentLine) {
          // 移除行尾空格
          result.push(currentLine.trim());
        }

        // 如果单个片段就超过最大宽度
        const segmentWidth = this.getTextWidth(segment, style);
        if (segmentWidth > maxWidth) {
          // 强制分割超长片段
          const splitSegments = this.breakLongSegment(segment, style, maxWidth);

          // 添加除最后一个外的所有分割部分
          for (let j = 0; j < splitSegments.length - 1; j++) {
            result.push(splitSegments[j]);
          }

          // 最后一个分割部分作为当前行
          currentLine = splitSegments[splitSegments.length - 1];
        } else {
          // 新行开始，如果片段是空格则跳过
          currentLine = this.isWhitespace(segment) ? '' : segment;
        }
      }
    }

    // 添加最后一行
    if (currentLine) {
      result.push(currentLine.trim());
    }

    return result;
  }

  /**
   * 判断片段是否全是空白字符
   */
  private static isWhitespace(segment: string): boolean {
    return /^\s+$/.test(segment);
  }

  /**
   * 将文本分割为片段，保持英文单词完整性（包括使用英文或中文撇号的单词）
   */
  private static splitTextIntoSegments(text: string): string[] {
    const segments: string[] = [];

    // 使用正则表达式匹配：
    // 1. 英文单词（包括使用英文撇号'或中文撇号’的缩写如 can't, I'm, can’t, I’m）
    // 2. 连续的非英文字符（包括中文、数字、标点等）
    // 3. 连续的空白字符
    const regex = /([a-zA-Z]+(?:['’][a-zA-Z]+)*)|([^a-zA-Z\s]+)|(\s+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        // 英文单词（包括使用英文或中文撇号的缩写）
        segments.push(match[1]);
      } else if (match[2]) {
        // 非英文字符序列（中文、数字、标点等）
        segments.push(match[2]);
      } else if (match[3]) {
        // 空白字符序列
        segments.push(match[3]);
      }
    }

    return segments;
  }

  /**
   * 分割超长片段
   */
  private static breakLongSegment(
    segment: string,
    style: Partial<TextStyle>,
    maxWidth: number
  ): string[] {
    const result: string[] = [];
    let currentPart = '';

    // 检查是否是英文单词（包括使用英文或中文撇号的缩写）
    const isEnglishWord = /^[a-zA-Z]+(?:['’][a-zA-Z]+)*$/.test(segment);

    // 如果是英文单词，尽量在合理位置分割
    if (isEnglishWord && segment.length > 3) {
      // 尝试在单词中间分割，但避免在撇号附近分割
      for (let i = 0; i < segment.length; i++) {
        const char = segment[i];
        const testPart = currentPart + char;
        const testWidth = this.getTextWidth(testPart, style);

        // 检查下一个字符是否是撇号，如果是则避免在此处分割
        const nextChar = i < segment.length - 1 ? segment[i + 1] : '';
        const isBeforeApostrophe = nextChar === "'" || nextChar === '’';

        if (testWidth <= maxWidth) {
          currentPart = testPart;
        } else {
          if (currentPart) {
            // 避免在撇号前分割
            if (isBeforeApostrophe && currentPart.length > 1) {
              // 如果下一个字符是撇号，且当前部分长度大于1，则回退一个字符
              const lastChar = currentPart[currentPart.length - 1];
              result.push(currentPart.slice(0, -1));
              currentPart = lastChar + char;
            } else {
              result.push(currentPart);
              currentPart = char;
            }
          } else {
            currentPart = char;
          }
        }
      }
    } else {
      // 非英文单词或短单词，按字符分割
      for (let i = 0; i < segment.length; i++) {
        const char = segment[i];
        const testPart = currentPart + char;
        const testWidth = this.getTextWidth(testPart, style);

        if (testWidth <= maxWidth) {
          currentPart = testPart;
        } else {
          if (currentPart) {
            result.push(currentPart);
          }
          currentPart = char;
        }
      }
    }

    if (currentPart) {
      result.push(currentPart);
    }

    return result;
  }
}
//#region 测试代码
// const width = TextUtils.getTextWidth('1111', {
//   fontSize: 16,
// });

// const lines = TextUtils.getTextWrap(
//   '作词: Dan Reynolds/Wayne Sermon/Ben McKee/Daniel Platzman',
//   {
//     fontSize: 16,
//   },
//   400
// );

// console.log('TextUtils.splitMixedText:', lines);

// console.log('TextUtils.getTextWidth:', width);

//#endregion
