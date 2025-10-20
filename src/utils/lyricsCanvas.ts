import { Application, Text, Container } from 'pixi.js';
import 'pixi.js/unsafe-eval';

// 工具函数
const utils = {
  // 缓动函数
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInCubic: (t: number): number => t * t * t,
  easeInOut: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  // 线性插值
  lerp: (start: number, end: number, t: number): number =>
    start + (end - start) * t,

  // 范围限制
  clamp: (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max),

  // 防抖函数
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: number | null = null;
    return function executedFunction(this: any, ...args: Parameters<T>): void {
      const later = () => {
        if (timeout) {
          clearTimeout(timeout);
        }
        func.apply(this, args);
      };
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = window.setTimeout(later, wait) as unknown as number;
    };
  },

  // 主题监听器
  createThemeListener: (callback: (isDark: boolean) => void) => {
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
  },

  // 预留：可添加其他工具函数
};

// 动画状态枚举
enum AnimationState {
  NORMAL = 'NORMAL',
  FADE_OUT = 'FADE_OUT',
  FADE_IN = 'FADE_IN',
}

// 配置选项接口
interface LyricConfigOptions {
  animDuration?: number;
  animDelayPerLine?: number;
  smoothFactor?: number;
  scaleSmoothFactor?: number;
  jumpThreshold?: number;
  fadeDuration?: number;
  highlightScale?: number;
  normalScale?: number;
  normalColor?: string;
  highlightColor?: string;
  fontSize?: number;
  lineHeightRatio?: number;
  // 主题颜色配置
  lightNormalColor?: string; // 浅色主题普通颜色
  lightHighlightColor?: string; // 浅色主题高亮颜色
  darkNormalColor?: string; // 深色主题普通颜色
  darkHighlightColor?: string; // 深色主题高亮颜色
  // 翻译行配置
  translationFontSize?: number;
}

interface LyricItem {
  time: number;
  lyric: string;
  // 翻译
  tlyric: string;
  index: number;
}

// 配置类
class LyricConfig {
  ANIM_DURATION: number;
  ANIM_DELAY_PER_LINE: number;
  SMOOTH_FACTOR: number;
  SCALE_SMOOTH_FACTOR: number;
  JUMP_THRESHOLD: number;
  FADE_DURATION: number;
  HIGHLIGHT_SCALE: number;
  NORMAL_SCALE: number;
  normalColor: string;
  highlightColor: string;
  fontSize: number;
  // 每行之间的间隔
  lineHeightRatio: number;

  // 主题颜色配置
  lightNormalColor: string;
  lightHighlightColor: string;
  darkNormalColor: string;
  darkHighlightColor: string;
  translationFontSize: any;

  constructor(options: LyricConfigOptions = {}) {
    this.ANIM_DURATION = options.animDuration || 700;
    this.ANIM_DELAY_PER_LINE = options.animDelayPerLine || 90;
    this.SMOOTH_FACTOR = options.smoothFactor || 0.15;
    this.SCALE_SMOOTH_FACTOR = options.scaleSmoothFactor || 0.1;
    this.JUMP_THRESHOLD = options.jumpThreshold || 100;
    this.FADE_DURATION = options.fadeDuration || 800;
    this.HIGHLIGHT_SCALE = options.highlightScale || 1;
    this.NORMAL_SCALE = options.normalScale || 0.8;

    // 颜色配置
    this.normalColor = options.normalColor || 'rgba(255, 255, 255, 0.3)';
    this.highlightColor = options.highlightColor || '0xffffff';

    // 主题颜色配置（默认值）
    this.lightNormalColor = options.lightNormalColor || 'rgba(0, 0, 0, 0.36)';
    this.lightHighlightColor =
      options.lightHighlightColor || 'rgba(0, 0, 0, 0.86)';
    this.darkNormalColor =
      options.darkNormalColor || 'rgba(255, 255, 255, 0.3)';
    this.darkHighlightColor = options.darkHighlightColor || '#ffffff';

    // 字体配置
    this.fontSize = options.fontSize || 26;
    this.lineHeightRatio = options.lineHeightRatio || 1.2;

    // 翻译行配置（只配置字体大小）
    this.translationFontSize = options.translationFontSize || 24;
  }
  // 设置主题
  setTheme(isDark: boolean): void {
    if (isDark) {
      this.normalColor = this.darkNormalColor;
      this.highlightColor = this.darkHighlightColor;
    } else {
      this.normalColor = this.lightNormalColor;
      this.highlightColor = this.lightHighlightColor;
    }
  }
}

// 歌词渲染器类
class LyricRenderer {
  config: LyricConfig;
  lyrics: LyricItem[];
  highlightIndex: number;
  currentY: number[]; // 每个歌词 Container 的 Y 坐标
  targetY: number[];
  currentScale: number[]; // 每个歌词 Container 的缩放
  targetScale: number[];
  lyricLineContainers: Container[]; // 每行歌词的 Container
  app: Application | null;

  constructor(config: LyricConfig) {
    this.config = config;
    this.lyrics = [];
    this.highlightIndex = 0;
    this.currentY = [];
    this.targetY = [];
    this.currentScale = [];
    this.targetScale = [];
    this.lyricLineContainers = [];
    this.app = null;
  }

  setLyric(lyric: Partial<LyricItem>[], app: Application): void {
    this.app = app;
    this.lyrics = lyric
      .map((item: Partial<LyricItem>, i: number) => ({
        time: item.time || 0,
        lyric: item.lyric?.trim() || '',
        tlyric: item.tlyric?.trim() || '',
        index: i,
      }))
      .sort((a: LyricItem, b: LyricItem) => a.time - b.time);
    this.highlightIndex = 0;

    // 初始化缩放与容器列表
    this.currentScale = this.lyrics.map(() => this.config.NORMAL_SCALE);
    this.targetScale = [...this.currentScale];
    this.lyricLineContainers = [];

    // 先创建文本，以便拿到准确高度
    // 初始化位置：稍后根据真实高度计算
    // 注意：这里不再调用基于固定行高的初始化
    // 文本创建会使用 this.currentY 现值（默认为 undefined），
    // 随后会统一设置位置
    // 为避免首次渲染前抖动，先以等距近似布局
    // this.initializePositions(app);
  }

  // 初始化位置（先用等距占位，防止首次闪烁）
  // initializePositions(app: Application): void {
  //   const centerY = app.screen.height / 2;
  //   const baseLineHeight = this.config.fontSize * this.config.lineHeightRatio;
  //   const groupSpacing = baseLineHeight * 1.1; // 组间间距

  //   // 计算初始位置：高亮行（第0行）居中
  //   const scrollOffsetY = centerY - 0 * groupSpacing;
  //   this.currentY = this.lyrics.map((_, i) => i * groupSpacing + scrollOffsetY);
  //   this.targetY = [...this.currentY];
  // }

  // 计算每一组（主歌词+翻译）的高度（按指定缩放模式）
  private computeLineHeights(mode: 'current' | 'target'): number[] {
    const groupGap = Math.max(
      8,
      this.config.fontSize * this.config.lineHeightRatio
    ); // 组间额外间距
    // 已创建：用文本自身高度（不受父容器缩放影响）计算基础高度，再乘以对应缩放
    if (this.lyricLineContainers.length === this.lyrics.length) {
      return this.lyricLineContainers.map((c, i) => {
        const mainText = (c.children[0] as Text | undefined) || undefined;
        const transText = (c.children[1] as Text | undefined) || undefined;
        const baseMain = mainText
          ? mainText.height
          : this.config.fontSize * this.config.lineHeightRatio;
        const baseTrans = transText
          ? transText.height
          : this.lyrics[i].tlyric
          ? this.config.translationFontSize * this.config.lineHeightRatio
          : 0;
        const baseHeight =
          baseMain + baseTrans + Math.max(6, this.config.fontSize * 0.2);
        const scale =
          mode === 'target'
            ? this.targetScale[i] ?? this.config.NORMAL_SCALE
            : this.currentScale[i] ?? this.config.NORMAL_SCALE;
        return baseHeight * scale + groupGap;
      });
    }
    // 回退：估算高度（未创建文本时）
    return this.lyrics.map((item, i) => {
      const baseMain = this.config.fontSize * 1.2;
      const baseTrans = item.tlyric ? this.config.translationFontSize * 1.2 : 0;
      const baseHeight =
        baseMain + baseTrans + Math.max(6, this.config.fontSize * 0.2);
      const scale =
        mode === 'target'
          ? this.targetScale[i] ?? this.config.NORMAL_SCALE
          : this.currentScale[i] ?? this.config.NORMAL_SCALE;
      return baseHeight * scale + groupGap;
    });
  }

  // 使用实际高度（按目标缩放）更新目标位置，使高亮组居中
  updateTargetPositions(app: Application, highlightIndex: number): void {
    const centerY = app.screen.height / 2;
    const heights = this.computeLineHeights('target');

    // 计算每组中心的累计位置
    const centers: number[] = [];
    let acc = 0;
    for (let i = 0; i < heights.length; i++) {
      const h = heights[i];
      centers[i] = acc + h / 2;
      acc += h;
    }

    const scrollOffsetY = centerY - centers[highlightIndex];

    // 更新目标 topY（使中心对齐 centerY）与缩放
    for (let i = 0; i < heights.length; i++) {
      const topY = centers[i] + scrollOffsetY - heights[i] / 2;
      this.targetY[i] = topY;
      this.targetScale[i] =
        i === highlightIndex
          ? this.config.HIGHLIGHT_SCALE
          : this.config.NORMAL_SCALE;
    }
  }

  // 使用当前缩放实时计算目标位置，防止缩放过渡期间的挤压/重叠
  // updateTargetPositionsWithCurrentScale(
  //   app: Application,
  //   highlightIndex: number
  // ): void {
  //   const centerY = app.screen.height / 2;
  //   const heights = this.computeLineHeights('current');

  //   const centers: number[] = [];
  //   let acc = 0;
  //   for (let i = 0; i < heights.length; i++) {
  //     const h = heights[i];
  //     centers[i] = acc + h / 2;
  //     acc += h;
  //   }

  //   const scrollOffsetY = centerY - centers[highlightIndex];

  //   for (let i = 0; i < heights.length; i++) {
  //     const topY = centers[i] + scrollOffsetY - heights[i] / 2;
  //     this.targetY[i] = topY;
  //     // 不改变 targetScale，这里只调整位置以维持间距
  //   }
  // }

  // 基于真实高度（按当前缩放），立即设置当前位置（用于首次布局或大跳转后）
  applyImmediateLayout(app: Application, highlightIndex: number): void {
    const centerY = app.screen.height / 2;
    const heights = this.computeLineHeights('current');
    const centers: number[] = [];
    let acc = 0;
    for (let i = 0; i < heights.length; i++) {
      const h = heights[i];
      centers[i] = acc + h / 2;
      acc += h;
    }
    const scrollOffsetY = centerY - centers[highlightIndex];
    for (let i = 0; i < heights.length; i++) {
      const topY = centers[i] + scrollOffsetY - heights[i] / 2;
      this.currentY[i] = topY;
      this.targetY[i] = topY;
      this.currentScale[i] =
        i === highlightIndex
          ? this.config.HIGHLIGHT_SCALE
          : this.config.NORMAL_SCALE;
      this.targetScale[i] = this.currentScale[i];
    }
  }

  createLyricTexts(app: Application, container: Container): void {
    // 清除现有容器
    container.removeChildren();
    this.lyricLineContainers = [];

    // 为每行歌词创建 Container
    this.lyrics.forEach((item, i) => {
      const lineContainer = new Container();
      lineContainer.position.set(10, this.currentY[i]); // 左边距 10px
      lineContainer.scale.set(this.currentScale[i]);

      // 计算文本可用宽度（左右各留 20px）
      const availableWidth = Math.max(0, app.screen.width - 20);

      const lyricText = new Text({
        text: item.lyric,
        style: {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: this.config.fontSize,
          fill: this.config.normalColor,
          align: 'left',
          wordWrap: true,
          wordWrapWidth: availableWidth,
          breakWords: true,
          fontWeight: 'bold',
        },
      });
      lyricText.position.set(0, 0);
      lyricText.anchor.set(0, 0); // 左上对齐，便于多行文本从顶部开始布局
      lineContainer.addChild(lyricText);

      if (item.tlyric) {
        const translationText = new Text({
          text: item.tlyric,
          style: {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: this.config.translationFontSize,
            fill: this.config.normalColor,
            align: 'left',
            wordWrap: true,
            wordWrapWidth: availableWidth,
            breakWords: true,
            fontWeight: 'normal',
          },
        });

        // 翻译行位置（相对于 Container）
        const lyricHeight =
          lyricText.height + Math.max(6, this.config.fontSize * 0.2);
        translationText.position.set(0, lyricHeight);
        translationText.anchor.set(0, 0); // 左上对齐

        lineContainer.addChild(translationText);
      }

      // 添加到主容器
      container.addChild(lineContainer);
      this.lyricLineContainers.push(lineContainer);
    });
  }

  // 更新所有文本的换行宽度以及翻译行的相对位置
  updateWordWrapWidth(app: Application): void {
    const availableWidth = Math.max(0, app.screen.width - 20);
    for (let i = 0; i < this.lyricLineContainers.length; i++) {
      const lineContainer = this.lyricLineContainers[i];
      if (!lineContainer) continue;
      // 第一个子元素为主歌词，第二个（如果存在）为翻译
      const mainText = lineContainer.children[0] as Text | undefined;
      const transText = lineContainer.children[1] as Text | undefined;
      if (mainText instanceof Text) {
        mainText.style.wordWrap = true;
        mainText.style.wordWrapWidth = availableWidth;
        mainText.style.breakWords = true;
      }
      if (transText instanceof Text) {
        transText.style.wordWrap = true;
        transText.style.wordWrapWidth = availableWidth;
        transText.style.breakWords = true;
        // 重新根据主行高度定位翻译行
        const lyricHeight =
          (mainText?.height || 0) + Math.max(6, this.config.fontSize * 0.2);
        transText.position.y = lyricHeight;
      }
    }
  }

  update(
    animationState: AnimationState,
    animationStartTime: number,
    highlightIndex: number,
    lastHighlightIndex: number,
    config: LyricConfig
  ): void {
    // 更新歌词 Container 位置（带正确的双向延迟）
    if (animationState === AnimationState.NORMAL) {
      // 在缩放过渡期间，基于当前缩放实时重算目标位置，避免相邻行挤压
      if (this.app) {
        this.updateTargetPositions(this.app, highlightIndex);
      }
      for (let i = 0; i < this.lyrics.length; i++) {
        const progress = this.getLineProgress(
          i,
          animationStartTime,
          highlightIndex,
          lastHighlightIndex,
          config
        );

        // 使用 progress 调整插值速度
        const adjustedFactor = config.SMOOTH_FACTOR * progress;
        this.currentY[i] +=
          (this.targetY[i] - this.currentY[i]) * adjustedFactor;

        // 平滑插值缩放
        this.currentScale[i] +=
          (this.targetScale[i] - this.currentScale[i]) *
          config.SCALE_SMOOTH_FACTOR;
      }
    }

    // 更新 Container 位置和缩放
    for (let i = 0; i < this.lyrics.length; i++) {
      const lineContainer = this.lyricLineContainers[i];

      if (lineContainer) {
        // 更新 Container 位置和缩放
        lineContainer.position.y = this.currentY[i];
        lineContainer.scale.set(this.currentScale[i]);

        // 更新文本颜色（遍历 Container 内的所有子元素）
        for (let j = 0; j < lineContainer.children.length; j++) {
          const textChild = lineContainer.children[j] as Text;
          if (textChild && textChild instanceof Text) {
            if (i === highlightIndex) {
              textChild.style.fill = this.config.highlightColor;
            } else {
              textChild.style.fill = this.config.normalColor;
            }
          }
        }
      }
    }
  }

  // 计算某一行的动画进度（带正确的双向延迟）
  getLineProgress(
    lineIndex: number,
    animationStartTime: number,
    highlightIndex: number,
    lastHighlightIndex: number,
    config: LyricConfig
  ): number {
    const now = performance.now();
    const elapsed = now - animationStartTime;
    if (elapsed < 0) return 0;

    let delay = 0;

    // 判断跳转方向
    if (lastHighlightIndex !== -1 && highlightIndex < lastHighlightIndex) {
      // 向后跳转（currentTime 变小）
      if (lineIndex <= highlightIndex) {
        // 高亮行及上方行：有延迟
        delay = (highlightIndex - lineIndex) * config.ANIM_DELAY_PER_LINE;
      } else {
        // 下方行：无延迟（立即移动）
        delay = 0;
      }
    } else {
      // 向前跳转（currentTime 变大）或初始状态
      if (lineIndex >= highlightIndex) {
        // 高亮行及下方行：有延迟
        delay = (lineIndex - highlightIndex) * config.ANIM_DELAY_PER_LINE;
      } else {
        // 上方行：无延迟（立即移动）
        delay = 0;
      }
    }

    let t = (elapsed - delay) / config.ANIM_DURATION;
    t = utils.clamp(t, 0, 1);

    // ease-out 缓动函数
    return utils.easeOutCubic(t);
  }
}

// 主渲染器类
export class WebGLLyricRenderer {
  private canvas: HTMLCanvasElement;
  private app: Application | null;
  private stage: Container | null;
  private config: LyricConfig;
  private highlightIndex: number;
  private animationState: AnimationState;
  private animationStartTime: number;
  private jumpTargetIndex: number;
  private isAnimating: boolean;
  private lastHighlightIndex: number;
  private time: number;
  private lyricRenderer: LyricRenderer;
  private lyricsContainer: Container | null;
  private eventHandlers: {
    resize: () => void;
  };
  private themeUnsubscribe: (() => void) | null = null;
  // 是否初始完成
  private initialized: Promise<void> | null;

  constructor(el: HTMLCanvasElement, options: LyricConfigOptions = {}) {
    if (!(el instanceof HTMLCanvasElement)) {
      throw new Error('Element must be an HTMLCanvasElement');
    }

    this.canvas = el;
    this.app = null;

    this.stage = null;

    // 配置
    this.config = new LyricConfig(options);

    // 状态
    this.highlightIndex = 0;
    this.animationState = AnimationState.NORMAL;
    this.animationStartTime = 0;
    this.jumpTargetIndex = 0;
    this.isAnimating = false;
    this.lastHighlightIndex = -1;
    this.time = 0;

    // 组件
    this.lyricRenderer = new LyricRenderer(this.config);

    // 容器
    this.lyricsContainer = null;

    // 事件处理器
    this.eventHandlers = {
      resize: utils.debounce(() => this.handleResize(), 100),
    };

    // 初始化
    this.initialized = this.init();
  }

  private async init(): Promise<void> {
    // 获取 Canvas 尺寸
    // const rect = this.canvas.getBoundingClientRect();

    // 创建 PixiJS 应用
    this.app = new Application();
    await this.app.init({
      view: this.canvas,
      resizeTo: this.canvas,
      // width: rect.width,
      // height: rect.height,
      //powerPreference: 'high-performance',
      antialias: true,
      // autoDensity: true,
      resolution: (window.devicePixelRatio || 1) * 1.4,
      // forceCanvas: false,
      // forceWebGL: true,
      backgroundAlpha: 0,
    });

    this.stage = this.app.stage;

    // 创建容器
    this.lyricsContainer = new Container();

    this.stage.addChild(this.lyricsContainer);

    // 监听窗口大小变化
    window.addEventListener('resize', this.eventHandlers.resize);
    // 监听系统主题变化
    this.themeUnsubscribe = utils.createThemeListener(isDark => {
      this.handleThemeChange(isDark);
    });
    // 启动渲染循环
    this.app.ticker.add(delta => {
      this.update(delta.deltaTime);
    });
  }

  private handleResize(): void {
    // 窗口大小改变时，同步更新换行宽度并重算目标位置
    if (this.app) {
      this.lyricRenderer.updateWordWrapWidth(this.app);
      this.lyricRenderer.updateTargetPositions(this.app, this.highlightIndex);
    }
  }

  async setLyric(lyric: Partial<Omit<LyricItem, 'index'>>[]): Promise<void> {
    console.log('📝 Setting lyrics, count:', lyric.length);
    if (this.initialized === null) {
      this.initialized = this.init();
    }
    await this.initialized;
    this.lyricRenderer.setLyric(lyric, this.app!);
    this.highlightIndex = 0;
    this.animationState = AnimationState.NORMAL;
    this.isAnimating = false;

    // 先创建文本，获取真实高度
    this.lyricRenderer.createLyricTexts(this.app!, this.lyricsContainer!);
    // 基于真实高度进行一次即时布局（避免换行导致的组间距异常）
    this.lyricRenderer.updateWordWrapWidth(this.app!);
    this.lyricRenderer.applyImmediateLayout(this.app!, this.highlightIndex);

    this.animationStartTime = performance.now();

    // 应用当前主题颜色
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.config.setTheme(isDark);
  }

  private startJumpAnimation(newIndex: number): void {
    this.isAnimating = true;
    this.animationState = AnimationState.FADE_OUT;
    this.jumpTargetIndex = newIndex;
    this.animationStartTime = performance.now();
  }

  setCurrentTime(currentTime: number): void {
    if (this.lyricRenderer.lyrics.length === 0) return;

    // 如果正在执行动画，忽略新的请求
    if (this.isAnimating) {
      return;
    }

    let newIndex = 0;
    for (let i = 0; i < this.lyricRenderer.lyrics.length; i++) {
      if (this.lyricRenderer.lyrics[i].time <= currentTime) {
        newIndex = i;
      } else break;
    }

    if (newIndex !== this.highlightIndex) {
      const jumpDistance = Math.abs(newIndex - this.highlightIndex);

      // 如果跳跃距离过大，启动淡出淡入动画
      if (jumpDistance > this.config.JUMP_THRESHOLD) {
        this.startJumpAnimation(newIndex);
        return;
      }

      // 小范围变化，使用平滑动画
      this.lastHighlightIndex = this.highlightIndex;
      this.highlightIndex = newIndex;
      if (this.app) {
        this.lyricRenderer.updateTargetPositions(this.app, this.highlightIndex);
      }
      this.animationStartTime = performance.now();
    }
  }

  private handleThemeChange(isDark: boolean): void {
    console.log('🎨 Theme changed:', isDark ? 'dark' : 'light');

    // 更新配置颜色
    this.config.setTheme(isDark);

    // 更新现有文本颜色
    const lyricLineContainers = this.lyricRenderer.lyricLineContainers;
    if (lyricLineContainers.length) {
      lyricLineContainers.forEach((lyricLineContainer, index) => {
        lyricLineContainer.children.forEach(child => {
          if (child instanceof Text) {
            if (index === this.highlightIndex) {
              child.style.fill = this.config.highlightColor;
            } else {
              child.style.fill = this.config.normalColor;
            }
          }
        });
      });
    }

    // 触发重新渲染
    this.app?.ticker.addOnce(() => {
      // 强制更新一次渲染
    });
  }

  private update(delta: number): void {
    const deltaTime = delta;
    this.time += deltaTime * 1000;

    // 处理淡出淡入动画
    if (this.animationState !== AnimationState.NORMAL) {
      this.handleFadeAnimation();
    }

    // 更新歌词
    this.lyricRenderer.update(
      this.animationState,
      this.animationStartTime,
      this.highlightIndex,
      this.lastHighlightIndex,
      this.config
    );
  }

  private handleFadeAnimation(): void {
    const now = performance.now();
    const elapsed = now - this.animationStartTime;

    if (this.animationState === AnimationState.FADE_OUT) {
      if (elapsed < this.config.FADE_DURATION) {
        // 淡出动画：降低透明度
        const fadeProgress = elapsed / this.config.FADE_DURATION;
        const alpha = 1 - fadeProgress;
        this.lyricsContainer!.alpha = alpha;
      } else {
        // 淡出完成，跳转到新状态
        this.highlightIndex = this.jumpTargetIndex;
        this.lyricRenderer.updateTargetPositions(
          this.app!,
          this.highlightIndex
        );

        // 立即更新当前位置
        for (let i = 0; i < this.lyricRenderer.lyrics.length; i++) {
          this.lyricRenderer.currentY[i] = this.lyricRenderer.targetY[i];
          this.lyricRenderer.currentScale[i] =
            this.lyricRenderer.targetScale[i];
        }

        this.animationState = AnimationState.FADE_IN;
        this.animationStartTime = now;
      }
    }

    if (this.animationState === AnimationState.FADE_IN) {
      if (elapsed < this.config.FADE_DURATION) {
        // 淡入动画：增加透明度
        const fadeProgress = elapsed / this.config.FADE_DURATION;
        const alpha = fadeProgress;
        this.lyricsContainer!.alpha = alpha;
      } else {
        // 淡入完成，恢复正常
        this.animationState = AnimationState.NORMAL;
        this.isAnimating = false;
        this.lyricsContainer!.alpha = 1;
      }
    }
  }

  // 获取歌词
  getLyric() {
    return this.lyricRenderer.lyrics;
  }
  destroy(): void {
    // 取消主题监听
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe();
      this.themeUnsubscribe = null;
    }

    window.removeEventListener('resize', this.eventHandlers.resize);
    if (this.app) {
      this.app.destroy(true);
    }
    this.canvas = null!;
    this.lyricRenderer = null!;
  }
  resize(): void {
    this.app?.resize();
  }
}
