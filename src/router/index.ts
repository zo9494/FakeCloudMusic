import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { defineComponent, h } from 'vue';

import Playlist from '@/views/PlaylistNew.vue';
import NotFoundPage from '@/views/404.vue';
import Result from '@/views/Result.vue';
import Setting from '@/views/Setting.vue';
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: NotFoundPage,
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
    path: '/:catchAll(.*)',
    component: NotFoundPage,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export { router };
