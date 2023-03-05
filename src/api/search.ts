import { service } from '@/utils/request';
import dayjs from 'dayjs';

export async function getHotSearch() {
  const data = await service.get<HotSearch.RootObject>('/search/hot', {
    params: {
      timestamp: dayjs().format('YYYYMMDDHH'),
    },
  });
  return data?.result.hots;
}

export async function getHotSearchDetail() {
  const data = await service.get<HotDetail.RootObject>('/search/hot/detail', {
    params: {
      timestamp: dayjs().format('YYYYMMDDHH'),
    },
  });
  return data?.data;
}

interface SearchSuggestParams {
  keywords: string;
  type?: 'mobile';
}

export async function getSearchSuggest(params: SearchSuggestParams) {
  const data = await service.get<HotSearchSuggest.RootObject>(
    '/search/suggest',
    {
      params,
    }
  );
  return data?.result;
}

interface SearchParams {
  keywords: string;
  limit?: number;
  offset?: number;
  type?: number;
}
/**
 *
 * @param params.limit 返回数量
 * @param params.offset 偏移数量，用于分页
 * @param params.type 搜索类型；默认为 1 即单曲 , 取值意义 : 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频, 1018:综合, 2000:声音(搜索声音返回字段格式会不一样)
 */
export async function getSearch(params: SearchParams) {
  const data = await service.get<Search.RootObject>('/search', {
    params,
  });
  return data?.result;
}
