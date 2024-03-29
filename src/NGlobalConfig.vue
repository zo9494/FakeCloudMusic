<script setup lang="ts">
import {
  NMessageProvider,
  NConfigProvider,
  GlobalThemeOverrides,
  NDialogProvider,
  darkTheme,
  lightTheme,
} from 'naive-ui';
import { ref, computed, provide, readonly } from 'vue';
import MainPage from './Main.vue';
import { themeKey, toggleThemeKey, themes } from '@/types';
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
  Button: {
    color: '#000',
  },
  Radio: {
    textColor: 'var(--font-color)',
  },
  Checkbox: {
    textColor: 'var(--font-color)',
  },
  Pagination: {
    itemBorderActive: '1px solid var(--primary-color)',
    itemTextColorActive: 'var(--primary-color)',
    itemTextColorHover: 'var(--primary-color)',
  },
};

//#region theme
let isDark = ref(false);

window.electron.ipcRenderer.invoke<boolean>('APP:IS_DARK').then(val => {
  isDark.value = val;
  updateThemeVal();
});

async function toggleTheme() {
  isDark.value = await window.electron.ipcRenderer.invoke<boolean>(
    'APP:DARK_MODE_TOGGLE'
  );
  updateThemeVal();
}
function updateThemeVal() {
  if (isDark.value) {
    localStorage.theme = themes.dark;
  } else {
    localStorage.theme = themes.light;
  }
}
const theme = computed(() => {
  return isDark.value ? themes.dark : themes.light;
});
provide(toggleThemeKey, toggleTheme);
provide(themeKey, readonly(theme));
const naiveUITheme = computed(() => {
  if (theme.value == themes.dark) {
    return darkTheme;
  }
  return lightTheme;
});
//#endregion
</script>

<template>
  <NConfigProvider
    tag="main"
    class="container"
    :theme="naiveUITheme"
    :theme-overrides="themeOverrides"
  >
    <NMessageProvider placement="bottom-right">
      <NDialogProvider>
        <MainPage />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
