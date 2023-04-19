import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { defineComponent, h } from 'vue';

import PlaylistNew from '@/views/PlaylistNew.vue';
import FindMusic from '@/views/FindMusic.vue';
import NotFoundPage from '@/views/404.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: NotFoundPage,
  },

  {
    path: '/playlist/:id',
    component: PlaylistNew,
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
