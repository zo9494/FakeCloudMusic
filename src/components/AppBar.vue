<template>
  <header :style="{ height: showCustomFrame ? '35px' : '45px' }">
    <div class="app-bar drag">
      <div class="app-bar-front">
        <span v-show="canBack" class="back no-drag">
          <button class="back-inner" @click="handleBack">
            <i class="bi bi-chevron-left"></i>
          </button>
        </span>
      </div>
      <div :class="{ 'app-bar-options': true, mac: !showCustomFrame }">
        <div class="app-bar-options-search no-drag">
          <Search />
        </div>
        <div class="app-bar-options-buttons no-drag">
          <button @click="toggleTheme">
            <i v-show="theme === themes.light" class="bi bi-moon"></i>
            <i v-show="theme === themes.dark" class="bi bi-sun"></i>
          </button>
          <button @click="Setting">
            <i class="bi bi-gear" />
          </button>
        </div>
      </div>
      <div v-if="showCustomFrame" class="app-bar-button-blank"> </div>
      <div v-if="showCustomFrame" class="app-bar-button no-drag">
        <WindowButton />
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { useRouter, useHistory } from '@/hooks/customRouter';

import WindowButton from './WindowButton.vue';
import Search from '@/components/search/Search.vue';
let showCustomFrame = false;
if (process.platform !== 'darwin') {
  showCustomFrame = true;
}

function useTheme() {
  enum themes {
    dark = 'dark',
    light = 'light',
  }

  const theme = ref(localStorage.theme || themes.light);
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

const { themes, theme, toggleTheme } = useTheme();
const router = useRouter();
const { canBack } = useHistory();
function Setting() {
  router.push({ name: 'SettingPage' });
}
function handleBack() {
  router.back();
}
</script>
<style lang="scss" scoped>
.back {
  font-size: 16px;
  &-inner {
    padding: 4px 7px;
    border-radius: 10px;
    &:hover {
      background-color: var(--app-bar-button-hover);
    }
  }
}
.app-bar {
  width: 100%;
  display: flex;
  justify-content: end;
  &-front {
    padding-left: 10px;
    flex: 1;
    display: flex;
    align-items: center;
  }
  &-options {
    display: flex;
    justify-content: flex-end;
    &.mac {
      padding-top: 10px;
    }
    &-search {
      padding-top: 5px;
      display: flex;
      align-items: center;
    }
    &-buttons {
      margin: 0 20px;
      display: flex;
      height: 30px;
      align-items: center;
      gap: 15px;
      button {
        height: 20px;
        width: 20px;
        font-size: 15px;
        border-radius: 100%;
        &:hover {
          background-color: var(--app-bar-button-hover);
        }
      }
    }
  }
  [class^='app-bar-button'] {
    width: 140px;
    height: 30px;
  }
  &-button {
    right: 0;
    position: absolute;
    z-index: 999;
  }
}
// .app_bar {
//   &-left {
//     grid-row: 1/2;
//     background-color: variables.$appBgColor;
//   }
//   &-right {
//     display: flex;
//     justify-content: end;
//     grid-row: 1/3;
//   }
// }
</style>
