import { createApp } from 'vue';
import { store } from '@/store';
import App from './Main.vue';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import './main.scss';
import '@/assets/style/iconfont.css';
import './normalize.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { router } from '@/router';
createApp(App).use(store).use(router).mount('#app');
