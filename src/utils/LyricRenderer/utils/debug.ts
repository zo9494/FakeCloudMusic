import { PreciseLyricLine } from '../PreciseLyricLine';
import type { NormalLyricLine } from '../NormalLyricLine';

interface LyricLineEntryLike {
  lyricLine: NormalLyricLine | PreciseLyricLine;
}

/** 在控制台输出当前歌词树中各类元素的数量统计 */
export function logElementCount(entries: LyricLineEntryLike[]): void {
  let containerNum = 0;
  let graphicsAndSpriteNum = 0;

  entries.forEach((entry) => {
    if (entry.lyricLine instanceof PreciseLyricLine) {
      containerNum += entry.lyricLine.words.length + 1;
      graphicsAndSpriteNum += entry.lyricLine.words.length;
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
    containerNum + graphicsAndSpriteNum * 2,
  );
}