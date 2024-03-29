import { createApp } from 'vue';
import { store } from '@/store';
import App from './NGlobalConfig.vue';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import './main.scss';
import '@/assets/style/common.scss';
import '@/assets/style/overwriteNaive.scss';
import '@/assets/style/segoe-fluent-icons.scss';
import '@/assets/style/iconfont.css';
import '@/assets/style/normalize.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { router } from '@/router';
createApp(App)
  .use(store)
  .use(router)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*');
  });
