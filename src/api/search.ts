import { service } from '@/utils/request';

export async function getHotSearch() {
  const data = await service.get<HotSearch>('/search/hot');
  return data?.result.hots;
}
