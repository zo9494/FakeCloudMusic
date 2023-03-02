import { createApp } from 'vue';
import { store } from '@/store/index';

import App from './App.vue';
import './main.scss';
import '@/assets/style/iconfont.css';
import './normalize.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { router } from './router/index';
createApp(App)
  .use(store)
  .use(router)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*');
  });
