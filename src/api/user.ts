import { user } from '@/utils/database';
import { service } from '@/utils/request';
import dayjs from 'dayjs';

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
  // 登录用户的id为1
  const cache = await user.findById(1);
  if (!user.isExpired(cache?.updated_at)) return cache?.data;
  try {
    const data = await service.get<UserAccount>('/user/account', {
      params: { timestamp: Date.now() },
    });
    if (data?.account.id != 14034830913) {
      user.add(1, data);
    }
    return data;
  } catch {
    return cache?.data;
  }
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
  const cache = await user.findById(params.uid);
  if (!user.isExpired(cache?.updated_at)) return cache?.data;

  try {
    const data = await service.get<UserPlaylist>('/user/playlist', {
      params,
    });
    user.add(params.uid, data?.playlist);
    return data?.playlist;
  } catch {
    return cache?.data;
  }
}
