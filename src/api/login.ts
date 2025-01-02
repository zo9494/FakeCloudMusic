import { service } from '@/utils/request';

interface QRKeyType {
  code: number;
  data: {
    code: number;
    unikey: string;
  };
}
export async function getQRKey() {
  const data = await service.get<QRKeyType>('/login/qr/key', {
    params: {
      timestamp: Date.now(),
    },
  });
  return data?.data;
}
interface QRType {
  data: {
    qrimg: string;
    qrurl: string;
  };
}
export async function getQR() {
  const qrKey = await getQRKey();

  const data = await service.get<QRType>('/login/qr/create', {
    params: {
      key: qrKey?.unikey,
      qrimg: true,
      timestamp: Date.now(),
    },
  });
  return {
    key: qrKey?.unikey,
    ...data?.data,
  };
}
interface QRCheckType {
  code: number;
  cookie: string;
  message: string;
}
export async function checkStatus(key: string) {
  const data = await service.get<QRCheckType>('/login/qr/check', {
    params: {
      key,
      timestamp: Date.now(),
    },
  });

  return data;
}

interface RefreshToken {
  code: number;
  cookie: string;
}
export async function refreshToken() {
  const data = await service.get<RefreshToken>('/login/refresh', {
    params: {
      timestamp: Date.now(),
    },
  });
  return data;
}
