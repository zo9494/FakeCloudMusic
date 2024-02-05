import { toRaw } from 'vue';

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
  console.log(toRaw(song));

  window.electron.ipcRenderer
    .invoke<any>('SAVE_SONG', toRaw(song))
    .then(res => {
      if (res && res.error) {
        alert('下载出错');
      }
    });
}
