import type { Application, Sprite, TextStyle } from 'pixi.js';
import type { LyricLine } from '../parseLyric';
import type { FontStyle } from './interface';

export abstract class BaseLyricLineWord {
  abstract style: FontStyle;
  abstract app: Application;
  /**
   * 高亮歌词行 (1=完全高亮)
   * @param progress 0-1 歌词行高亮进度
   * @param index 歌词行要高亮的单词、字符的下标
   */
  abstract highlight(progress: number, index: number): void;
  /**
   * 清除高亮
   */
  abstract clearHighlight(): void;
  /**
   * 更新遮罩
   */
  abstract updateMask(): void;
  /**
   * 移除遮罩
   */
  abstract removeMask(): void;
}

export abstract class BaseLyricLine extends BaseLyricLineWord {
  abstract maxWidth: number;
  /**
   * 创建歌词
   */
  abstract createLyricLine(lyric: LyricLine, style: Partial<TextStyle>): void;
}
