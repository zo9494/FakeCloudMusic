import { service } from '@/utils/request';
import dayjs from 'dayjs';

export async function getHotSearch() {
  const data = await service.get<HotSearch>('/search/hot', {
    params: {
      timestamp: dayjs().format('YYYYMMDDHH'),
    },
  });
  return data?.result.hots;
}

export async function getHotSearchDetail() {
  const data = await service.get<HotSearchDetail>('/search/hot/detail', {
    params: {
      timestamp: dayjs().format('YYYYMMDDHH'),
    },
  });
  return data?.data;
}

interface SearchSuggestParams {
  keywords: string;
}

export async function getSearchSuggest(params: SearchSuggestParams) {
  const data = await service.get<SearchSuggest>('/search/suggest', {
    params,
  });
  return data?.result;
}
