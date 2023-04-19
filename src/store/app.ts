import { defineStore } from 'pinia';

interface AppState {
  appbar: {
    back: Boolean;
    backPath?: string;
  };
}

export const useAppStore = defineStore<'app', AppState>('app', {
  state: () => ({
    appbar: {
      back: false,
    },
  }),
});
