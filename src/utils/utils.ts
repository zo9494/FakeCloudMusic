const timeRegExp = /^\[(?<min>\d+):(?<sec>\d+).(?<millisec>\d+)\]/;
function transformLyricCore(lyric?: string) {
  const lyrics: Pick<Lyric, 'lyric' | 'time'>[] = [];
  if (!lyric) {
    return lyrics;
  }
  const tempLyricArray = lyric.split(/\n/);

  tempLyricArray.forEach(element => {
    const matches = element.match(timeRegExp);
    if (matches) {
      const minute = matches.groups?.min;
      const sec = matches.groups?.sec;
      const millisec = matches.groups?.millisec;
      const time = Number(minute) * 60 + Number(sec) + Number(millisec) / 1000;
      const lyric = element.slice(matches[0].length);
      lyrics.push({
        time,
        lyric,
      });
    }
  });
  return lyrics;
}
/**
 * 转换歌词
 */
export function transformLyric(lyric: string, tlyric?: string) {
  let lyrics = transformLyricCore(lyric);

  if (tlyric) {
    const temp = new Map<number, Lyric>();
    lyrics.forEach(item => {
      temp.set(item.time, item);
    });
    const tlyrics = transformLyricCore(tlyric);
    tlyrics.forEach(item => {
      if (temp.has(item.time)) {
        temp.set(item.time, {
          ...(temp.get(item.time) as Lyric),
          tlyric: item.lyric,
        });
      }
    });

    lyrics = Array.from(temp.values());
  }

  lyrics.sort((a, b) => a.time - b.time);
  console.table(lyrics);
  return lyrics;
}
export interface DynamicLyricWord {
  time: number;
  duration: number;
  flag: number;
  word: string;
}
export interface LyricLine {
  time: number;
  duration: number;
  lyric: string;
  tlyric?: string;
  romanLyric?: string;
  dynamicLyricTime?: number;
  dynamicLyric?: DynamicLyricWord[];
}

const yrcLineRegexp = /^\[(?<time>[0-9]+),(?<duration>[0-9]+)\](?<line>.*)/;
const yrcWordTimeRegexp =
  /^\((?<time>[0-9]+),(?<duration>[0-9]+),(?<flag>[0-9]+)\)(?<word>[^\(]*)/;
export function transformDynamicLyric(lyric: string): LyricLine[] {
  const result: LyricLine[] = [];
  // 解析逐词歌词
  for (const line of lyric.trim().split('\n')) {
    let tmp = line.trim();
    const lineMatches = tmp.match(yrcLineRegexp);
    if (lineMatches) {
      const time = parseInt(lineMatches.groups?.time || '0');
      const duration = parseInt(lineMatches.groups?.duration || '0');
      tmp = lineMatches.groups?.line || '';
      const words: DynamicLyricWord[] = [];
      while (tmp.length > 0) {
        const wordMatches = tmp.match(yrcWordTimeRegexp);
        if (wordMatches) {
          const wordTime = parseInt(wordMatches.groups?.time || '0');
          const wordDuration = parseInt(wordMatches.groups?.duration || '0');
          const flag = parseInt(wordMatches.groups?.flag || '0');
          const word = wordMatches.groups?.word.trimStart();
          const splitedWords = word
            ?.split(/\s+/)
            .filter(v => v.trim().length > 0); // 有些歌词一个单词还是一个句子的就离谱
          if (splitedWords) {
            const splitedDuration = wordDuration / splitedWords.length;
            splitedWords.forEach((subWord, i) => {
              if (i === splitedWords.length - 1) {
                if (word?.endsWith(' ')) {
                  words.push({
                    time: wordTime + i * splitedDuration,
                    duration: splitedDuration,
                    flag,
                    word: `${subWord.trimStart()} `,
                  });
                } else {
                  words.push({
                    time: wordTime + i * splitedDuration,
                    duration: splitedDuration,
                    flag,
                    word: subWord.trimStart(),
                  });
                }
              } else if (i === 0) {
                if (word?.startsWith(' ')) {
                  words.push({
                    time: wordTime + i * splitedDuration,
                    duration: splitedDuration,
                    flag,
                    word: ` ${subWord.trimStart()}`,
                  });
                } else {
                  words.push({
                    time: wordTime + i * splitedDuration,
                    duration: splitedDuration,
                    flag,
                    word: subWord.trimStart(),
                  });
                }
              } else {
                words.push({
                  time: wordTime + i * splitedDuration,
                  duration: splitedDuration,
                  flag,
                  word: `${subWord.trimStart()} `,
                });
              }
            });
          }
          tmp = tmp.slice(wordMatches.index || wordMatches[0].length);
        } else {
          break;
        }
      }
      const line: LyricLine = {
        time,
        duration,
        lyric: words.map(v => v.word).join(''),
        dynamicLyric: words,
        dynamicLyricTime: time,
      };
      result.push(line);
      // log("逐词歌词", time, duration, line.lyric);
    }
  }
  return result;
}

export function getArName(Ar: Base[]) {
  return Ar.map(item => item.origin_name || item.name).join(' / ');
}

export function isNotEmpty(str: string): boolean {
  if (str && /\S/g.test(str)) {
    return false;
  } else {
    return true;
  }
}

export function getImageColor(url: string): Promise<[number, number, number]> {
  return new Promise<[number, number, number]>(resolve => {
    let img = new Image();
    img.src = url;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let img = new Image();
      img.src = url;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        let context = canvas.getContext('2d');
        if (!context) {
          return [245, 245, 245];
        }

        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 获取像素数据
        let data = context.getImageData(0, 0, img.width, img.height).data;
        let r = 1,
          g = 1,
          b = 1;
        // 取所有像素的平均值
        for (var row = 0; row < img.height; row++) {
          for (var col = 0; col < img.width; col++) {
            if (row == 0) {
              r += data[img.width * row + col];
              g += data[img.width * row + col + 1];
              b += data[img.width * row + col + 2];
            } else {
              r += data[(img.width * row + col) * 4];
              g += data[(img.width * row + col) * 4 + 1];
              b += data[(img.width * row + col) * 4 + 2];
            }
          }
        }

        // 求取平均值
        r /= img.width * img.height;
        g /= img.width * img.height;
        b /= img.width * img.height;

        // 将最终的值取整
        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);
        console.log(r, g, b);
        resolve([r, g, b]);
      };
    };
  });
}

export function download(song: any) {
  window.electron.ipcRenderer
    .invoke<any>('SAVE_SONG', song, localStorage.cookie)
    .then(res => {
      console.log(res);

      if (res && res.error) {
        alert('下载出错');
      }
    });
}
