import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { defineComponent, h } from 'vue';
import Playlist from '@/views/Playlist.vue';

const Home = defineComponent({
  render() {
    return h('div', 'def');
  },
});

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Home,
  },
  {
    path: '/playlist/:id',
    component: Playlist,
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
