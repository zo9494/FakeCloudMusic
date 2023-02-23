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
