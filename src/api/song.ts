import { service } from '@/utils/request';
import { isArray } from 'lodash';
import { transformLyric } from '@/utils/utils';
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

export function getSongUrl(id: Id): Promise<SongUrl>;
export function getSongUrl(ids: Ids): Promise<SongUrl[]>;

export async function getSongUrl(ids: Id | Ids) {
  const f = isArray(ids);
  const res = await service.get<{ data: SongUrl[] }>('/song/url', {
    params: {
      id: f ? ids.join(',') : ids,
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
  lrc: lyric;
  tlyric: lyric;
}

export async function getLyric(id: Id) {
  const data = await service.get<lyrics>('/lyric/new', {
    params: { id },
  });

  if (data?.lrc) {
    return transformLyric(data.lrc.lyric, data?.tlyric?.lyric);
  }
}
