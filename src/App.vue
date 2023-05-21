<script setup lang="ts">
import {
  NConfigProvider,
  GlobalThemeOverrides,
  NDialogProvider,
  darkTheme,
  lightTheme,
} from 'naive-ui';
import { nextTick, ref, computed } from 'vue';
import AppBar from './components/AppBar.vue';
import Menu from './components/Menu.vue';
import UserLogin from './components/UserLogin.vue';
import Player from '@/views/Player.vue';
import { RouterView } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const { order } = storeToRefs(userStore);
const themeOverrides: GlobalThemeOverrides = {
  Slider: {
    handleSize: '12px',
  },
  Popover: {
    color: 'var(--bg-color)',
    textColor: 'var(--font-color)',
  },
  Dialog: {
    closeMargin: '5px',
    padding: '10px',
    color: 'var(--bg-color)',
    textColor: 'var(--font-color)',
  },

  Radio: {
    textColor: 'var(--font-color)',
  },
  Checkbox: {
    textColor: 'var(--font-color)',
  },
};

//#region theme
enum themes {
  dark = 'dark',
  light = 'light',
}
function useTheme() {
  const theme = ref<keyof typeof themes>(localStorage.theme || themes.light);
  const toggleTheme = () => {
    if (theme.value === themes.dark) {
      theme.value = themes.light;
    } else {
      theme.value = themes.dark;
    }
    localStorage.theme = theme.value;
    document.documentElement.dataset.theme = theme.value;
  };
  document.documentElement.dataset.theme = theme.value;
  return { themes, theme, toggleTheme };
}

const { theme, toggleTheme } = useTheme();
const naiveUITheme = computed(() => {
  if (theme.value == themes.dark) {
    return darkTheme;
  }
  return lightTheme;
});
//#endregion

window.loadUser = () => {
  console.log('loadUser');
  userStore.getUserAccount();
};
nextTick(() => {
  postMessage({ payload: 'removeLoading' }, '*');
});
</script>

<template>
  <NConfigProvider
    tag="main"
    class="container"
    :theme="naiveUITheme"
    :theme-overrides="themeOverrides"
  >
    <NDialogProvider>
      <aside class="container-left-nav">
        <div class="drag"></div>
        <div class="user">
          <UserLogin />
        </div>
        <aside class="scrollbar">
          <Menu :menu="order"></Menu>
        </aside>
      </aside>
      <div class="container-right-view">
        <AppBar :theme="theme" :toggleTheme="toggleTheme"></AppBar>
        <div class="container-right-view-inner">
          <RouterView v-slot="{ Component, route }">
            <transition name="scale" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </RouterView>
        </div>
      </div>
      <div class="container-player">
        <Player />
      </div>
    </NDialogProvider>
  </NConfigProvider>
</template>

<style lang="scss">
.container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: 200px auto;

  &-left-nav {
    overflow: hidden;
    display: grid;
    grid-template-rows: 20px 50px auto;
    background-color: var(--menu-color);
  }

  &-right-view {
    padding: 0 2px 0 2px;
    height: 100%;
    overflow: hidden;
    position: relative;
    &-inner {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }
  }

  &-player {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
  }

  .user {
    background-color: var(--menu-color);
  }
}
</style>
