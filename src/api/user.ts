import { service } from '@/utils/request';

interface QRKeyType {
  code: number;
  unikey: string;
}
export async function getQRKey() {
  const {
    data: { data },
  } = await service.get<QRKeyType>('login/qr/key');
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
    },
  });
  return data;
}
