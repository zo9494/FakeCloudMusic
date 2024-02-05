import { service } from '@/utils/request';
interface PlaylistDetailParams {
  id: string;
  s?: string;
  timestamp?: any;
}
export async function getPlaylistDetail(params: PlaylistDetailParams) {
  const data = await service.get<PlaylistDetail>('/playlist/detail', {
    params,
  });

  return data;
}
export enum OP {
  add = 'add',
  del = 'del',
}
export interface UpdatePlaylistParams {
  op: keyof typeof OP;
  pid: number;
  tracks: string;
}
/**
 * 添加歌曲到歌单或者从歌单删除某首歌曲 ( 需要登录 )
 * @param params.op 从歌单增加单曲为 add, 删除为 del
 * @param params.pid 歌单 id
 * @param params.tracks 歌曲 id,可多个,用逗号隔开
 */
export async function updatePlaylist(params: UpdatePlaylistParams) {
  const data = await service.get<Playlist.UpdatePlaylist>('/playlist/tracks', {
    params,
  });
  if (!data?.body) {
    throw new Error(JSON.stringify(data));
  }
}
