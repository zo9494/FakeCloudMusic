// 歌词行
export interface LyricLine {
  // 开始时间
  time: number;
  // 主歌词行文本
  text: string;
  // 罗马音歌词
  romaText?: string;
  // 歌词翻译
  translateText?: string;
  // 持续时长
  duration: number;
  // 如果不为空，则表示有逐字歌词
  children?: LyricLineChild[];
}

// 单个字符
export interface LyricLineChild {
  time: number;
  text: string;
  duration: number;
}

/**
 * 解析歌词
 * @param lyric 主歌词
 * @param tlyric 翻译歌词
 * @param romaLyric 罗马音歌词
 * @param ylyric 逐字歌词
 * @param tylyric 逐字歌词翻译
 */
export function parseLyric(
  lyric: string,
  tlyric = '',
  romaLyric = '',
  ylyric = '',
  tylyric = ''
): LyricLine[] {
  // 优先使用逐字歌词
  if (ylyric) {
    return parseYrcLyric(ylyric, tylyric || tlyric, romaLyric);
  }

  // 否则解析普通歌词
  return parseStandardLyric(lyric, tlyric, romaLyric);
}

/**
 * 解析逐字歌词
 */
function parseYrcLyric(
  ylyric: string,
  tlyric: string,
  romaLyric: string
): LyricLine[] {
  const yrcLines = parseYrcFormat(ylyric);
  const transLines = parseLrcLines(tlyric);
  const romaLines = parseLrcLines(romaLyric);

  // 为逐字歌词匹配翻译和罗马音
  return yrcLines.map(line => {
    // 查找最接近的翻译行
    const transLine = findClosestLine(transLines, line.time);
    const romaLine = findClosestLine(romaLines, line.time);

    return {
      ...line,
      translateText: transLine?.text,
      romaText: romaLine?.text,
    };
  });
}

/**
 * 解析标准歌词
 */
function parseStandardLyric(
  lyric: string,
  tlyric: string,
  romaLyric: string
): LyricLine[] {
  const mainLines = parseLrcLines(lyric);
  const transLines = parseLrcLines(tlyric);
  const romaLines = parseLrcLines(romaLyric);

  return mainLines.map(line => {
    const transLine = findClosestLine(transLines, line.time);
    const romaLine = findClosestLine(romaLines, line.time);

    return {
      time: line.time,
      text: line.text,
      duration: 0,
      translateText: transLine?.text,
      romaText: romaLine?.text,
    };
  });
}

/**
 * 解析标准LRC格式歌词，返回带时间戳的歌词行数组
 */
function parseLrcLines(lyric: string): Array<{ time: number; text: string }> {
  const result: Array<{ time: number; text: string }> = [];

  lyric.split('\n').forEach(line => {
    line = line.trim();
    if (!line) return;

    // 处理JSON格式行
    if (line.startsWith('{')) {
      try {
        const jsonData = JSON.parse(line);
        if (jsonData.t !== undefined && jsonData.c) {
          const text = jsonData.c.map((item: any) => item.tx || '').join('');
          if (text.trim()) {
            result.push({
              time: jsonData.t,
              text: text.trim(),
            });
          }
        }
      } catch {
        // JSON解析失败，忽略此行
      }
      return;
    }

    // 处理标准LRC格式行 [mm:ss.xx]
    const match = line.match(/^\[(\d+):(\d+)\.(\d+)\](.*)/);
    if (match) {
      const [, min, sec, ms, text] = match;
      const time = parseInt(min) * 60000 + parseInt(sec) * 1000 + parseInt(ms);
      if (text.trim()) {
        result.push({
          time,
          text: text.trim(),
        });
      }
    }
  });

  // 按时间排序
  return result.sort((a, b) => a.time - b.time);
}

/**
 * 解析逐字歌词格式
 */
function parseYrcFormat(ylyric: string): LyricLine[] {
  const lines: LyricLine[] = [];

  ylyric.split('\n').forEach(line => {
    line = line.trim();
    if (!line) return;

    // 处理JSON格式行
    if (line.startsWith('{')) {
      try {
        const jsonData = JSON.parse(line);
        if (jsonData.t !== undefined && jsonData.c) {
          const text = jsonData.c.map((item: any) => item.tx || '').join('');
          if (text.trim()) {
            lines.push({
              time: jsonData.t,
              text: text.trim(),
              duration: 0,
              children: [],
            });
          }
        }
      } catch {
        // JSON解析失败，忽略此行
      }
      return;
    }

    // 处理逐字歌词行 [startTime,duration](word1)(word2)...
    const lineMatch = line.match(/^\[(\d+),(\d+)\](.*)/);
    if (lineMatch) {
      const [, startTime, duration, content] = lineMatch;
      const lineStartTime = parseInt(startTime);
      const lineDuration = parseInt(duration);

      const children: Text[] = [];
      let fullText = '';

      // 解析逐字内容 (startTime,duration,unknown)text
      const wordRegex = /\((\d+),(\d+),\d\)([^\(\)]*)/g;
      let wordMatch;

      while ((wordMatch = wordRegex.exec(content)) !== null) {
        const [, wordTime, wordDuration, wordText] = wordMatch;
        const wordStartTime = parseInt(wordTime);
        const wordDur = parseInt(wordDuration);

        children.push({
          time: wordStartTime,
          text: wordText,
          duration: wordDur,
        });
        fullText += wordText;
      }

      if (fullText.trim()) {
        lines.push({
          time: lineStartTime,
          text: fullText.trim(),
          duration: lineDuration,
          children: children.length > 0 ? children : undefined,
        });
      }
    }
  });

  // 按时间排序
  return lines.sort((a, b) => a.time - b.time);
}

/**
 * 查找最接近时间点的歌词行
 */
function findClosestLine(
  lines: Array<{ time: number; text: string }>,
  targetTime: number
): { time: number; text: string } | null {
  if (lines.length === 0) return null;

  // 精确匹配
  const exactMatch = lines.find(line => line.time === targetTime);
  if (exactMatch) return exactMatch;

  // 查找最接近的行（允许500ms的误差）
  let closestLine: { time: number; text: string } | null = null;
  let minDiff = Infinity;

  for (const line of lines) {
    const diff = Math.abs(line.time - targetTime);
    if (diff < minDiff && diff <= 500) {
      // 500ms误差范围
      minDiff = diff;
      closestLine = line;
    }
  }

  return closestLine;
}
