import type {
  Application,
  ColorSource,
  Graphics,
  Sprite,
  TextStyleFontWeight,
} from 'pixi.js';
import type { LyricLine } from '../parseLyric';

export interface LyricWordRenderData {
  height: number;
  width: number;
  graphics: Graphics;
  mask: Sprite;
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
  normal: {
    color: ColorSource;
    alpha?: number;
  };
  highlight: {
    color: ColorSource;
    alpha?: number;
  };
}