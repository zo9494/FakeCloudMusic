import { createRouter, createWebHashHistory } from "vue-router";
import { defineComponent, h } from 'vue'

const PlayList = defineComponent({
  render() {

    return h('div', this.$route.params.id)
  }
})
const Home = defineComponent({
  render() {
    return h('div', 'def')
  }
})

const routes = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/id/:id",
    component: PlayList
  }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})