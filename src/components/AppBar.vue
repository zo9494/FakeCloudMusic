<template>
  <header :style="{ height: showCustomFrame ? '35px' : '45px' }">
    <div class="app-bar drag">
      <div :class="{ 'app-bar-options': true, mac: !showCustomFrame }">
        <div class="app-bar-options-search no-drag">
          <Search />
        </div>
        <div class="app-bar-options-buttons no-drag">
          <button @click="toggleTheme">
            <i v-show="theme === themes.dark" class="bi bi-moon"></i>
            <i v-show="theme === themes.light" class="bi bi-sun"></i>
          </button>
          <button @click="clickSetting">
            <i class="bi bi-gear" />
          </button>
        </div>
      </div>
      <div v-if="showCustomFrame" class="app-bar-button no-drag">
        <WindowButton />
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import WindowButton from './WindowButton.vue';
import Search from '@/components/search/Search.vue';
let showCustomFrame = false;
if (process.platform !== 'darwin') {
  showCustomFrame = true;
}

function clickSetting() {
  alert('功能开发中...');
}

function useTheme() {
  enum themes {
    dark = 'dark',
    light = 'light',
  }
  const theme = ref(themes.light);
  const toggleTheme = () => {
    if (theme.value === themes.dark) {
      theme.value = themes.light;
    } else {
      theme.value = themes.dark;
    }
    document.documentElement.dataset.theme = theme.value;
  };
  document.documentElement.dataset.theme = themes.light;
  return { themes, theme, toggleTheme };
}

const { themes, theme, toggleTheme } = useTheme();
</script>
<style lang="scss" scoped>
.app-bar {
  left: 0px;
  right: 0px;
  top: 0px;
  z-index: 999;
  position: absolute;
  display: flex;
  justify-content: end;
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
  &-button {
    width: 140px;
    height: 30px;
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
