import { createApp } from 'vue';
import 'virtual:svg-icons-register';
import SvgIcon from './components/SvgIcon.vue';
import App from './App.vue';
import './main.scss';
import './normalize.css';
import { router } from './router/index';
createApp(App)
  .use(router)
  .component('SvgIcon', SvgIcon)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*');
  });
