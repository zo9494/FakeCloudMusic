import { service } from '@/utils/request';

interface PlaylistDetailParams {
  id: string;
  s?: string;
}
export async function getPlaylistDetail(params: PlaylistDetailParams) {
  const data = await service.get<PlaylistDetail>('/playlist/detail', {
    params,
  });
  return data;
}
