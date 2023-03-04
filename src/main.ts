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

window.getCookie = () => {
  const str: string | undefined = localStorage.cookie;
  if (!str) {
    return null;
  }
  const cookieStrs: string[] = str.split(';');
  let cookieObj: { [propName: string]: any } = {};
  cookieStrs.forEach(str => {
    const [key, value] = str.split('=');
    if (key !== undefined && value !== undefined) {
      cookieObj[key] = value;
    }
  });
  console.log(cookieObj);
  return 'MUSIC_U=' + cookieObj['MUSIC_U'];
};
