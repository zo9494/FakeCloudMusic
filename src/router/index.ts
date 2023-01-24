import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { defineComponent, h } from 'vue';
const PlayList = defineComponent({
  render() {
    return h('div', this.$route.params.id);
  },
});
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
    path: '/id/:id',
    component: PlayList,
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
