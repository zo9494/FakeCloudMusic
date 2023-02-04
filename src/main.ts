import { createApp } from 'vue';
import { store } from '@/store/index';
import 'virtual:svg-icons-register';
import SvgIcon from './components/SvgIcon.vue';
import App from './App.vue';
import './main.scss';
import '@/assets/style/iconfont.css';
import './normalize.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { router } from './router/index';
createApp(App)
  .use(store)
  .use(router)
  .component('SvgIcon', SvgIcon)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*');
  });
