import { service } from '@/utils/request';

export async function getHotSearch() {
  const data = await service.get<HotSearch>('/search/hot');
  return data?.result.hots;
}

export async function getHotSearchDetail() {
  const data = await service.get<HotSearchDetail>('/search/hot/detail');
  return data?.data;
}
