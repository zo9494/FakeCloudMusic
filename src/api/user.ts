import { service } from '@/utils/request';

interface QRKeyType {
  code: number;
  unikey: string;
}
export async function getQRKey() {
  const {
    data: { data },
  } = await service.get<QRKeyType>('login/qr/key', {
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
  } = await service.get<QRType>('login/qr/create', {
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
  const { data } = await service.get('login/qr/check', {
    params: {
      key,
      timestamp: Date.now(),
    },
  });

  return data as any as QRCheckType;
}
