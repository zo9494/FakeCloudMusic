/**
 * 转换歌词
 */
export function transformLyric(...lyrics: string[]) {
  let tempLyric = new Map<number, Lyric>();
  lyrics.forEach(lyric => {
    if (!lyric) {
      return;
    }

    const tempLyricArray = lyric.split(/\n/);
    tempLyricArray.forEach(element => {
      const lyric = element.split(/\]/);
      let temTime = lyric[0].replace(/\[/g, '').split(/:/);
      let time = Number(temTime[0]) * 60 + Number(temTime[1]);

      if (!isNaN(time)) {
        if (tempLyric.has(time)) {
          // 翻译歌词
          tempLyric.set(time, {
            ...(tempLyric.get(time) as Lyric),
            tlyric: lyric[1],
          });
        } else {
          tempLyric.set(time, {
            time,
            lyric: lyric[1],
          });
        }
      }
    });
  });
  let lyric = Array.from(tempLyric.values());
  lyric.sort((a, b) => a.time - b.time);

  return lyric;
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
