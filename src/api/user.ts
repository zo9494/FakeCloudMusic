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
  const data = await service.get<UserAccount>('/user/account', {
    params: { timestamp: Date.now() },
  });

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

export async function getSubCount(params: UserPlaylistParams) {
  const data = await service.get<UserPlaylist>('/user/playlist', {
    params,
  });
  return data?.playlist;
}
