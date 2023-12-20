import { service } from '@/utils/request';

interface PersonalizedParams {
  limit?: number;
}
export async function getPersonalized(params?: PersonalizedParams) {
  return await service.get<Personalized.PersonalizedType>('/personalized', {
    params,
  });
}
