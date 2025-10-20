// 歌词行
interface LyricLine {
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
  children?: Text[];
}

// 单个字符
interface Text {
  time: number;
  text: string;
  duration: number;
}

/**
 * 解析歌词
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

// // 测试数据
// const data = {
//   sgc: false,
//   sfy: false,
//   qfy: false,
//   transUser: {
//     id: 1746838,
//     status: 99,
//     demand: 1,
//     userid: 3313801,
//     nickname: '咆哮的小清新___',
//     uptime: 1476926264933,
//   },
//   lyricUser: {
//     id: 1746816,
//     status: 99,
//     demand: 0,
//     userid: 45217425,
//     nickname: 'MOLLYMU',
//     uptime: 1476926264933,
//   },
//   lrc: {
//     version: 31,
//     lyric:
//       '{"t":0,"c":[{"tx":"作词: "},{"tx":"Dan Reynolds"},{"tx":"/"},{"tx":"Wayne Sermon"},{"tx":"/"},{"tx":"Ben McKee"},{"tx":"/"},{"tx":"Daniel Platzman"}]}\n{"t":1000,"c":[{"tx":"作曲: "},{"tx":"Dan Reynolds"},{"tx":"/"},{"tx":"Wayne Sermon"},{"tx":"/"},{"tx":"Ben McKee"},{"tx":"/"},{"tx":"Daniel Platzman"}]}\n[00:08.21]Am I out of touch\n[00:10.20]Am I out of my place\n[00:12.39]When I keep saying that I\'m looking for an empty space\n[00:16.21]Oh I\'m wishing you\'re here\n[00:18.21]But I\'m wishing you\'re gone\n[00:20.46]I can\'t have you when I’m only gonna do you wrong\n[00:24.22]Oh I\'m gonna mess this up\n[00:26.26]Oh this is just my luck\n[00:28.26]Over and over and over again\n[00:31.91]In the meantime we let it go\n[00:33.87]At the roadside that we used to know\n[00:35.71]We can let this drift away\n[00:37.85]Oh We let this drift away\n[00:39.92]And there\'s always time to change your mind\n[00:41.72]Oh there\'s always time to change your mind\n[00:43.70]Oh there\'s always time to change your mind\n[00:45.78]Oh love, can you hear me\n[00:48.45]\n[01:04.18]I\'m sorry for everything oh everything I\'ve done\n[01:07.70]From the second day I was born I think I had a loaded gun\n[01:11.50]And I shot shot shot a hole through everything I loved\n[01:15.81]Oh I shot shot shot a hole through every single thing that I loved\n[01:20.85]\n[01:36.20]Am I out of luck\n[01:38.28]Am I waiting to break\n[01:40.47]When I keep saying that I\'m looking for a way to escape\n[01:44.27]Oh I\'m wishing I had\n[01:46.23]What I\'ve taken for granted\n[01:48.39]I can\'t have you when I\'m only gonna do you wrong\n[01:52.13]Oh I\'m gonna mess this up\n[01:54.23]Oh this is just my luck\n[01:56.23]Over and over and over again\n[01:59.76]In the meantime we let it go\n[02:01.94]At the roadside we used to know\n[02:03.97]We can let this drift away\n[02:05.95]Oh we let this drift away\n[02:07.83]And there\'s always time to change your mind\n[02:09.71]Oh there\'s always time to change your mind\n[02:11.76]Oh there\'s always time to change your mind\n[02:13.75]Oh love, can you hear me\n[02:16.44]\n[02:32.62]I\'m sorry for everything oh everything I\'ve done\n[02:35.72]From the second day I was born I think I had a loaded gun\n[02:39.42]And I shot shot shot a hole through everything I love\n[02:44.06]Oh I shot shot shot a hole through every single thing that I loved\n[02:48.45]\n',
//   },
//   klyric: {
//     version: 0,
//     lyric: '',
//   },
//   tlyric: {
//     version: 8,
//     lyric:
//       '[by:MOLLYMU]\n[00:08.21]我是否已变得难以接近\n[00:10.20]是否已偏离我心中的自己\n[00:12.39]当我不断想要追寻某个并不存在的偏执梦境\n[00:16.21]我明明很希望你在我身边\n[00:18.21]却又想干脆与你就此不见\n[00:20.46]我无法将你拥入怀里 因我只会不断做出伤害你的事情\n[00:24.22]噢我只会将事情都搞砸\n[00:26.26]噢这大概就是我的宿命吧\n[00:28.26]不停重复不知悔改不长记性的命啊\n[00:31.91]就现在 我们能否就让一切随风\n[00:33.87]在这彼此都无比熟悉的路口\n[00:35.71]就此放手 让一切远走\n[00:37.85]所有所爱所珍视所经历的痛\n[00:39.92]噢你总在说服自己改变离开的决定\n[00:41.72]这次你能否再次说服自己回心转意\n[00:43.70]能否再次说服自己改变离开的决定\n[00:45.78]噢亲爱的 你能否听到我的悔意\n[00:48.45]\n[01:04.18]对过去的一切 我真的很抱歉\n[01:07.70]我仿佛从出生起就开始像一把上膛的枪 只会将一切毁灭\n[01:11.50]一枪一枪 对着我心爱的一切 将其一一毁灭\n[01:15.81]一枪一枪 让我生活中所有美好的细节留下千疮百孔的残缺\n[01:20.85]\n[01:36.20]是否我已将好运耗尽\n[01:38.28]是否我只有等待着破碎降临\n[01:40.47]当我不断想要找到出口 逃离我眼前的恐惧\n[01:44.27]噢我总希望能拥有\n[01:46.23]我认为理所应当的一切\n[01:48.39]我无法向你伸出我手 在我只会不断伤害你的时候\n[01:52.13]噢我只会将事情都搞砸\n[01:54.23]噢这大概就是我的宿命吧\n[01:56.23]不停重复不知悔改不长记性的命啊\n[01:59.76]就现在 我们能否就让一切随风\n[02:01.94]在这彼此都无比熟悉的路口\n[02:03.97]就此放手 让一切远走\n[02:05.95]所有所爱所珍视所经历的痛\n[02:07.83]噢你总在说服自己改变离开的决定\n[02:09.71]这次你能否再次说服自己回心转意\n[02:11.76]能否再次说服自己改变离开的决定\n[02:13.75]噢亲爱的 你能否听到我的悔意\n[02:16.44]\n[02:32.62]对过去的一切 我真的很抱歉\n[02:35.72]我仿佛从出生起就开始像一把上膛的枪 只会将一切毁灭\n[02:39.42]一枪一枪 对着我心爱的一切 将其一一毁灭\n[02:44.06]一枪一枪 让我生活中所有美好的细节留下千疮百孔的残缺\n[02:48.45]',
//   },
//   romalrc: {
//     version: 0,
//     lyric: '',
//   },
//   yrc: {
//     version: 15,
//     lyric:
//       '{"t":0,"c":[{"tx":"作词: "},{"tx":"Dan Reynolds"},{"tx":"/"},{"tx":"Wayne Sermon"},{"tx":"/"},{"tx":"Ben McKee"},{"tx":"/"},{"tx":"Daniel Platzman"}]}\n{"t":1000,"c":[{"tx":"作曲: "},{"tx":"Dan Reynolds"},{"tx":"/"},{"tx":"Wayne Sermon"},{"tx":"/"},{"tx":"Ben McKee"},{"tx":"/"},{"tx":"Daniel Platzman"}]}\n[8220,2010](8220,570,0)Am (8790,210,0)I (9000,390,0)out (9390,330,0)of (9720,510,0)touch\n[10260,2100](10260,540,0)Am (10800,210,0)I (11010,300,0)out (11310,90,0)of (11400,270,0)my (11670,690,0)place\n[12390,3780](12390,180,0)When (12570,120,0)I (12690,240,0)keep (12930,570,0)saying (13500,300,0)that (13800,180,0)I\'m (13980,450,0)looking (14430,360,0)for (14790,210,0)an (15000,600,0)empty (15600,570,0)space\n[16290,1770](16290,540,0)Oh (16830,150,0)I\'m (16980,510,0)wishing (17490,240,0)you\'re (17730,330,0)here\n[18180,2220](18180,600,0)But (18780,180,0)I\'m (18960,510,0)wishing (19470,210,0)you\'re (19680,720,0)gone\n[20490,3720](20490,180,0)I (20670,330,0)can\'t (21000,270,0)have (21270,210,0)you (21480,300,0)when (21780,30,0)I(21810,30,0)’(21840,180,0)m (22020,390,0)only (22410,510,0)gonna (22920,390,0)do (23310,390,0)you (23700,510,0)wrong\n[24240,1770](24240,420,0)Oh (24660,120,0)I\'m (24780,180,0)gonna (24960,270,0)mess (25230,330,0)this (25560,450,0)up\n[26250,1890](26250,450,0)Oh (26700,210,0)this (26910,90,0)is (27000,240,0)just (27240,180,0)my (27420,720,0)luck\n[28170,4200](28170,600,0)Over (28770,270,0)and (29040,510,0)over (29550,240,0)and (29790,510,0)over (30300,2070,0)again\n[32370,1320](32370,120,0)In (32490,180,0)the (32670,210,0)meantime (32880,90,0)we (32970,210,0)let (33180,150,0)it (33330,360,0)go\n[33750,1950](33750,150,0)At (33900,90,0)the (33990,750,0)roadside (34740,90,0)that (34830,150,0)we (34980,300,0)used (35280,60,0)to (35340,360,0)know\n[35730,1920](35730,120,0)We (35850,150,0)can (36000,450,0)let (36450,480,0)this (36930,360,0)drift (37290,360,0)away\n[37740,1740](37740,120,0)Oh (37860,120,0)We (37980,480,0)let (38460,450,0)this (38910,390,0)drift (39300,180,0)away\n[39480,2100](39480,120,0)And (39600,300,0)there\'s (39900,570,0)always (40470,360,0)time (40830,150,0)to (40980,300,0)change (41280,90,0)your (41370,210,0)mind\n[41610,1980](41610,90,0)Oh (41700,210,0)there\'s (41910,570,0)always (42480,330,0)time (42810,150,0)to (42960,330,0)change (43290,90,0)your (43380,210,0)mind\n[43590,2010](43590,60,0)Oh (43650,270,0)there\'s (43920,570,0)always (44490,270,0)time (44760,90,0)to (44850,450,0)change (45300,90,0)your (45390,210,0)mind\n[45630,2940](45630,240,0)Oh (45870,210,0)love(46080,0,0), (46080,90,0)can (46170,990,0)you (47160,570,0)hear (47730,840,0)me\n[64110,3540](64110,330,0)I\'m (64440,300,0)sorry (64740,300,0)for (65040,750,0)everything (65790,270,0)oh (66060,630,0)everything (66690,180,0)I\'ve (66870,780,0)done\n[67680,3810](67680,180,0)From (67860,90,0)the (67950,300,0)second (68250,330,0)day (68580,120,0)I (68700,150,0)was (68850,450,0)born (69300,120,0)I (69420,360,0)think (69780,90,0)I (69870,450,0)had (70320,30,0)a (70350,510,0)loaded (70860,630,0)gun\n[71520,4020](71520,150,0)And (71670,150,0)I (71820,630,0)shot (72450,480,0)shot (72930,390,0)shot (73320,60,0)a (73380,330,0)hole (73710,330,0)through (74040,630,0)everything (74670,150,0)I (74820,720,0)love\n[75600,4920](75600,210,0)Oh (75810,120,0)I (75930,630,0)shot (76560,390,0)shot (76950,390,0)shot (77340,30,0)a (77370,360,0)hole (77730,330,0)through (78060,330,0)every (78390,510,0)single (78900,330,0)thing (79230,330,0)that (79560,150,0)I (79710,810,0)loved\n[96210,1980](96210,570,0)Am (96780,210,0)I (96990,390,0)out (97380,360,0)of (97740,450,0)luck\n[98280,2070](98280,540,0)Am (98820,90,0)I (98910,570,0)waiting (99480,210,0)to (99690,660,0)break\n[100380,3840](100380,180,0)When (100560,120,0)I (100680,240,0)keep (100920,570,0)saying (101490,300,0)that (101790,180,0)I\'m (101970,480,0)looking (102450,360,0)for (102810,120,0)a (102930,360,0)way (103290,270,0)to (103560,660,0)escape\n[104250,1920](104250,630,0)Oh (104880,60,0)I\'m (104940,600,0)wishing (105540,180,0)I (105720,450,0)had\n[106200,2280](106200,600,0)What (106800,150,0)I\'ve (106950,480,0)taken (107430,300,0)for (107730,750,0)granted\n[108510,3720](108510,150,0)I (108660,300,0)can\'t (108960,300,0)have (109260,210,0)you (109470,330,0)when (109800,210,0)I\'m (110010,420,0)only (110430,480,0)gonna (110910,390,0)do (111300,390,0)you (111690,540,0)wrong\n[112260,1740](112260,390,0)Oh (112650,120,0)I\'m (112770,180,0)gonna (112950,270,0)mess (113220,330,0)this (113550,450,0)up\n[114240,1890](114240,450,0)Oh (114690,210,0)this (114900,90,0)is (114990,240,0)just (115230,210,0)my (115440,690,0)luck\n[116160,4230](116160,630,0)Over (116790,240,0)and (117030,510,0)over (117540,240,0)and (117780,540,0)over (118320,2070,0)again\n[120390,1290](120390,90,0)In (120480,210,0)the (120690,180,0)meantime (120870,90,0)we (120960,240,0)let (121200,120,0)it (121320,360,0)go\n[121740,1950](121740,150,0)At (121890,90,0)the (121980,870,0)roadside (122850,120,0)we (122970,300,0)used (123270,60,0)to (123330,360,0)know\n[123720,1950](123720,150,0)We (123870,120,0)can (123990,450,0)let (124440,480,0)this (124920,390,0)drift (125310,360,0)away\n[125730,1830](125730,120,0)Oh (125850,120,0)we (125970,480,0)let (126450,480,0)this (126930,360,0)drift (127290,270,0)away\n[127620,1980](127620,247,0)And (127867,247,0)there\'s (128114,247,0)always (128361,247,0)time (128608,247,0)to (128855,247,0)change (129102,247,0)your (129349,251,0)mind\n[129630,1980](129630,90,0)Oh (129720,180,0)there\'s (129900,570,0)always (130470,360,0)time (130830,150,0)to (130980,300,0)change (131280,120,0)your (131400,210,0)mind\n[131640,1950](131640,90,0)Oh (131730,210,0)there\'s (131940,540,0)always (132480,270,0)time (132750,90,0)to (132840,450,0)change (133290,90,0)your (133380,210,0)mind\n[133650,2910](133650,1290,0)Oh (134940,210,0)love(135150,30,0), (135180,210,0)can (135390,120,0)you (135510,240,0)hear (135750,810,0)me\n[152280,3480](152280,150,0)I\'m (152430,300,0)sorry (152730,330,0)for (153060,720,0)everything (153780,270,0)oh (154050,630,0)everything (154680,210,0)I\'ve (154890,870,0)done\n[155760,3720](155760,90,0)From (155850,90,0)the (155940,330,0)second (156270,300,0)day (156570,180,0)I (156750,90,0)was (156840,450,0)born (157290,150,0)I (157440,330,0)think (157770,90,0)I (157860,480,0)had (158340,30,0)a (158370,510,0)loaded (158880,600,0)gun\n[159510,4080](159510,180,0)And (159690,120,0)I (159810,630,0)shot (160440,510,0)shot (160950,360,0)shot (161310,60,0)a (161370,360,0)hole (161730,330,0)through (162060,600,0)everything (162660,150,0)I (162810,780,0)love\n[163620,5670](163620,180,0)Oh (163800,120,0)I (163920,660,0)shot (164580,360,0)shot (164940,390,0)shot (165330,30,0)a (165360,390,0)hole (165750,300,0)through (166050,360,0)every (166410,510,0)single (166920,330,0)thing (167250,330,0)that (167580,120,0)I (167700,1590,0)loved\n',
//   },
//   ytlrc: {
//     version: 3,
//     lyric:
//       '[00:08.220]我是否已变得难以接近\n[00:10.260]是否已偏离我心中的自己\n[00:12.390]当我不断想要追寻某个并不存在的偏执梦境\n[00:16.290]我明明很希望你在我身边\n[00:18.180]却又想干脆与你就此不见\n[00:20.490]我无法将你拥入怀里 因我只会不断做出伤害你的事情\n[00:24.240]噢我只会将事情都搞砸\n[00:26.250]噢这大概就是我的宿命吧\n[00:28.170]不停重复不知悔改不长记性的命啊\n[00:32.370]就现在 我们能否就让一切随风\n[00:33.750]在这彼此都无比熟悉的路口\n[00:35.730]就此放手 让一切远走\n[00:37.740]所有所爱所珍视所经历的痛\n[00:39.480]噢你总在说服自己改变离开的决定\n[00:41.610]这次你能否再次说服自己回心转意\n[00:43.590]能否再次说服自己改变离开的决定\n[00:45.630]噢亲爱的 你能否听到我的悔意\n[01:04.110]对过去的一切 我真的很抱歉\n[01:07.680]我仿佛从出生起就开始像一把上膛的枪 只会将一切毁灭\n[01:11.520]一枪一枪 对着我心爱的一切 将其一一毁灭\n[01:15.600]一枪一枪 让我生活中所有美好的细节留下千疮百孔的残缺\n[01:36.210]是否我已将好运耗尽\n[01:38.280]是否我只有等待着破碎降临\n[01:40.380]当我不断想要找到出口 逃离我眼前的恐惧\n[01:44.250]噢我总希望能拥有\n[01:46.200]我认为理所应当的一切\n[01:48.510]我无法向你伸出我手 在我只会不断伤害你的时候\n[01:52.260]噢我只会将事情都搞砸\n[01:54.240]噢这大概就是我的宿命吧\n[01:56.160]不停重复不知悔改不长记性的命啊\n[02:00.390]就现在 我们能否就让一切随风\n[02:01.740]在这彼此都无比熟悉的路口\n[02:03.720]就此放手 让一切远走\n[02:05.730]所有所爱所珍视所经历的痛\n[02:07.620]噢你总在说服自己改变离开的决定\n[02:09.630]这次你能否再次说服自己回心转意\n[02:11.640]这次你能否再次说服自己回心转意\n[02:13.650]噢亲爱的 你能否听到我的悔意\n[02:32.280]对过去的一切 我真的很抱歉\n[02:35.760]我仿佛从出生起就开始像一把上膛的枪 只会将一切毁灭\n[02:39.510]一枪一枪 对着我心爱的一切 将其一一毁灭\n[02:43.620]一枪一枪 让我生活中所有美好的细节留下千疮百孔的残缺',
//   },
//   code: 200,
// };
// const res = parseLyric(
//   data.lrc.lyric,
//   data.tlyric.lyric,
//   data.romalrc.lyric,
//   data.yrc.lyric,
//   data.ytlrc.lyric
// );

// const id = 2697656415;
// fetch(`http://127.0.0.1:3000/lyric/new?id=${id}`)
//   .then(res => {
//     return res.json();
//   })
//   .then(data => {
//     const lyrics = parseLyric(
//       data.lrc.lyric,
//       data.tlyric?.lyric,
//       data.romalrc?.lyric,
//       data.yrc?.lyric,
//       data.ytlrc?.lyric
//     );
//     console.log(lyrics);
//   });
// console.log(res);
