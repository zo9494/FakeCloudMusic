import type { LyricLine } from '../../parseLyric';

export interface HighlightState {
  lineIndex: number;
  wordIndex: number;
  progress: number;
}

/**
 * 根据当前时间在歌词数据中定位应高亮的行下标
 */
export function findCurrentLineIndex(
  lyricData: LyricLine[],
  currentTime: number,
  fallbackIndex: number,
): number {
  for (let i = 0; i < lyricData.length; i++) {
    const line = lyricData[i];
    const nextLine = lyricData[i + 1];

    if (nextLine && currentTime >= line.time && currentTime < nextLine.time) {
      return i;
    }
    if (!nextLine && currentTime >= line.time) {
      return i;
    }
  }

  // 兜底：如果当前时间还在上次高亮行的范围内，沿用旧行
  if (
    fallbackIndex >= 0 &&
    fallbackIndex < lyricData.length &&
    currentTime >= lyricData[fallbackIndex].time
  ) {
    return fallbackIndex;
  }

  return -1;
}

/**
 * 根据当前时间在逐字歌词行中计算应高亮的词下标及进度
 */
export function findWordHighlightState(
  lineData: LyricLine,
  currentTime: number,
): { wordIndex: number; progress: number } {
  let wordIndex = -1;
  let progress = 0;
  let allWordsCompleted = true;

  for (let i = 0; i < (lineData.children?.length ?? 0); i++) {
    const child = lineData.children![i];

    if (currentTime >= child.time && currentTime < child.time + child.duration) {
      wordIndex = i;
      progress = (currentTime - child.time) / child.duration;
      allWordsCompleted = false;
      break;
    } else if (currentTime >= child.time + child.duration) {
      wordIndex = i;
      progress = 1;
    } else {
      allWordsCompleted = false;
      break;
    }
  }

  if (wordIndex >= 0) {
    return { wordIndex, progress };
  }

  if (allWordsCompleted) {
    return { wordIndex: (lineData.children?.length ?? 1) - 1, progress: 1 };
  }

  return { wordIndex: -1, progress: 0 };
}