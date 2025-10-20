import { service } from '@/utils/request';
import { isArray } from 'lodash';
import { transformLyric } from '@/utils/utils';
import { Invoke } from '@/utils/ipcRenderer';
import { lyric } from '@/utils/database';
type Id = number | string;
type Ids = string[] | number[];

export function getSongDetail(id: Id): Promise<Track>;
export function getSongDetail(ids: Ids): Promise<Track[]>;

export async function getSongDetail(ids: Id | Ids) {
  const f = isArray(ids);
  const data = await service.get<SongDetail>('/song/detail', {
    params: {
      ids: f ? ids.join(',') : ids.toString(),
    },
  });
  if (f) {
    return data?.songs;
  }
  return data?.songs[0];
}

type Level =
  | 'standard'
  | 'higher'
  | 'exhigh'
  | 'lossless'
  | 'hires'
  | 'jyeffect'
  | 'sky'
  | 'jymaster';
export function getSongUrl(id: Id, level?: Level): Promise<SongUrl>;
export function getSongUrl(ids: Ids, level?: Level): Promise<SongUrl[]>;

/**
 *
 * @param ids
 * @param level 播放音质等级, 分为 standard => 标准,higher => 较高, exhigh=>极高, lossless=>无损, hires=>Hi-Res, jyeffect => 高清环绕声, sky => 沉浸环绕声, jymaster => 超清母带
 * @returns
 */
export async function getSongUrl(ids: Id | Ids, level: Level = 'standard') {
  const f = isArray(ids);
  const res = await service.get<{ data: SongUrl[] }>('/song/url/v1', {
    params: {
      id: f ? ids.join(',') : ids,
      level,
    },
  });
  if (!res?.data) {
    return;
  }
  if (f) {
    return res.data;
  }
  return res.data[0];
}

interface lyric {
  lyric: string;
}
interface lyrics {
  // 主歌词
  lrc: lyric;
  // 翻译歌词
  tlyric: lyric;
  // 逐字歌词
  yrc: lyric;
  // 罗马注音歌词
  romalrc: lyric;
  // 逐字歌词翻译
  ytlrc: lyric;
}

export async function getLyric(id: Id) {
  const cache = await lyric.findById(id);

  if (!lyric.isExpired(cache?.updated_at)) return cache?.data;
  // api:/lyric似乎没有api:/lyric/new准
  const data = await service.get<lyrics>('/lyric', {
    params: { id },
  });

  if (data?.lrc) {
    const lyrics = transformLyric(data.lrc.lyric, data?.tlyric?.lyric);
    lyric.add(id, lyrics);
    return lyrics;
  } else {
    return cache?.data;
  }
}

interface D {
  id: number;
  params: string[];
}
// UnblockResult
interface UnblockResult {
  audioId: number;
  url: string;
  songName: string;
  error: any;
}
export async function getUnblockSong(
  d: D, // 重试3次
  retries = 3
): Promise<UnblockResult | undefined> {
  try {
    return Invoke('APP:UNBLOCK', d);
  } catch (error) {
    console.log(error);
  }
}
