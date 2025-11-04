import type {
  Application,
  ColorSource,
  Graphics,
  TextStyleFontWeight,
} from 'pixi.js';
import type { LyricLine } from '../parseLyric';

export interface LyricLineWordType {
  height: number;
  width: number;
  graphics: Graphics;
}

export interface LyricLineOptions {
  app: Application;
  line: LyricLine;
  style: FontStyle;
  maxWidth: number;
}

export interface FontStyle {
  fontSize: number;
  fontWeight?: TextStyleFontWeight;
  // 非高亮
  normal: {
    color: ColorSource;
    alpha?: number;
  };
  // 高亮
  highlight: {
    color: ColorSource;
    alpha?: number;
  };
}
