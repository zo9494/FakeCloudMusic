import type { LyricLine } from '../parseLyric';

export interface IHightlightable {
  highlight(progress: number, index: number): void;
  clearHighlight(): void;
  updateMask(): void;
  removeMask(): void;
}

export interface BaseLyricLine extends IHightlightable {
  maxWidth: number;
  createLyricLine(lyric: LyricLine): void;
}