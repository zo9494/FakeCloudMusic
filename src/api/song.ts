import { service } from '@/utils/request';
import { isArray } from 'lodash';

type Id = number | string;
type Ids = string[] | number[];

export function getSongDetail(id: Id): Promise<Track>;
export function getSongDetail(ids: Ids): Promise<Track[]>;

export async function getSongDetail(ids: Id | Ids) {
  const f = isArray(ids);
  const { data } = await service.get<SongDetail>('/song/detail', {
    params: {
      ids: f ? ids.join(',') : ids,
    },
  });
  if (f) {
    return data.songs;
  }
  return data.songs[0];
}

export function getSongUrl(id: Id): Promise<SongUrl>;
export function getSongUrl(ids: Ids): Promise<SongUrl[]>;

export async function getSongUrl(ids: Id | Ids) {
  const f = isArray(ids);
  const { data } = await service.get<{}, SongUrl[]>('/song/url', {
    params: {
      id: f ? ids.join(',') : ids,
    },
  });
  if (f) {
    return data.data;
  }
  return data.data[0];
}
