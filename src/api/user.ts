import { user } from '@/utils/database';
import { service } from '@/utils/request';

interface UserAccount {
  code: number;
  account: {
    id: number;
  };
  profile: {
    nickname: string;
    avatarUrl: string;
    userId: number;
  };
}

export async function getUserAccount() {
  const cache = await user.getUser();
  if (cache) return cache.data;
  const data = await service.get<UserAccount>('/user/account', {
    params: { timestamp: Date.now() },
  });
  if (data.account.id != 14034830913) {
    user.setUser(data);
  }
  return data;
}

interface UserPlaylistParams {
  uid: number;
  limit?: number;
  offset?: number;
}

interface UserPlaylist {
  more: boolean;
  playlist: Playlist[];
}

export async function getSubCount(
  params: UserPlaylistParams
): Promise<Playlist[]> {
  const cache = await user.getUserPlaylist(params.uid);
  if (cache) return cache.data;
  debugger;
  const data = await service.get<UserPlaylist>('/user/playlist', {
    params,
  });
  user.setUserPlaylist(params.uid, data?.playlist);
  return data?.playlist;
}
