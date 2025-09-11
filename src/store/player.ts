import { defineStore } from 'pinia';
import { getSongDetail, getLyric, getSongUrl } from '@/api/song';
import { getArName } from '@/utils/utils';
interface PlayerState {}

interface PlayerActions {}

export const usePlayerStore = defineStore<
  'player',
  PlayerState,
  {},
  PlayerActions
>('player', {
  state: () => ({}),
  actions: {},
});
