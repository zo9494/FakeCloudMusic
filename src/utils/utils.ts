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
      lyric &&
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

export function getArName(Ar?: Base[]) {
  if (!Ar) {
    return '';
  }
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
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      // 低分辨率采样，降低像素处理量
      const SAMPLE = 32;
      const ratio =
        img.width && img.height
          ? Math.min(SAMPLE / img.width, SAMPLE / img.height)
          : 1;
      const w = Math.max(1, Math.round(img.width * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext('2d');
      if (!context) {
        resolve([245, 245, 245]);
        return;
      }
      context.drawImage(img, 0, 0, w, h);
      const imageData = context.getImageData(0, 0, w, h).data;

      let rSum = 0,
        gSum = 0,
        bSum = 0,
        count = 0;
      // 正确的 RGBA 跨步遍历
      for (let i = 0; i < imageData.length; i += 4) {
        const a = imageData[i + 3];
        if (a === 0) continue; // 跳过完全透明像素
        rSum += imageData[i];
        gSum += imageData[i + 1];
        bSum += imageData[i + 2];
        count++;
      }

      if (count === 0) {
        resolve([245, 245, 245]);
        return;
      }

      const r = Math.round(rSum / count);
      const g = Math.round(gSum / count);
      const b = Math.round(bSum / count);
      resolve([r, g, b]);
    };
    img.onerror = () => resolve([245, 245, 245]);
    img.src = url;
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
