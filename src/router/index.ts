import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import FindMusic from '@/views/FindMusic.vue';
import Playlist from '@/views/PlaylistNew.vue';
import NotFoundPage from '@/views/404.vue';
import Result from '@/views/Result.vue';
import Setting from '@/views/Setting.vue';
import LocalMusic from '@/views/LocalMusic.vue';
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'FindMusic',
    component: FindMusic,
  },

  {
    path: '/playlist/:id',
    name: 'PlaylistPage',
    component: Playlist,
  },
  {
    path: '/search/:keywords',
    name: 'SearchPage',
    component: Result,
  },
  {
    path: '/setting',
    name: 'SettingPage',
    component: Setting,
  },
  {
    path: '/local',
    name: 'localMusic',
    component: LocalMusic,
  },
  {
    path: '/:catchAll(.*)',
    component: NotFoundPage,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export { router };
