import '@/assets/style/common.scss';
import { createApp } from 'vue';
import '@/assets/style/segoe-fluent-icons.scss';
import '@/assets/style/normalize.css';
import App from '@/views/Login.vue';
createApp(App)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*');
  });
