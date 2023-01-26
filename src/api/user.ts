import { service } from '@/utils/request';

interface QRKeyType {
  code: number;
  unikey: string;
}
export async function getQRKey() {
  const {
    data: { data },
  } = await service.get<{}, QRKeyType>('login/qr/key', {
    params: {
      timestamp: Date.now(),
    },
  });
  return data;
}
interface QRType {
  qrimg: string;
  qrurl: string;
}
export async function getQR() {
  const { unikey: key } = await getQRKey();
  const {
    data: { data },
  } = await service.get<{}, QRType>('login/qr/create', {
    params: {
      key,
      qrimg: true,
      timestamp: Date.now(),
    },
  });
  return {
    key,
    ...data,
  };
}
interface QRCheckType {
  code: number;
  cookie: string;
  message: string;
}
export async function checkStatus(key: string) {
  const { data } = await service.get<QRCheckType>('login/qr/check', {
    params: {
      key,
      timestamp: Date.now(),
    },
  });

  return data;
}
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
  const { data } = await service.get<UserAccount>('/user/account', {
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
  const { data } = await service.get<UserPlaylist>('/user/playlist', {
    params,
  });
  return data.playlist;
}
