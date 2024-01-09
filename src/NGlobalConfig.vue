<script setup lang="ts">
import {
  NConfigProvider,
  GlobalThemeOverrides,
  NDialogProvider,
  darkTheme,
  lightTheme,
} from 'naive-ui';
import { ref, computed, provide, readonly } from 'vue';
import MainPage from './Main.vue';
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
provide('toggleTheme', toggleTheme);
provide('theme', readonly(theme));
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
    <NDialogProvider>
      <MainPage />
    </NDialogProvider>
  </NConfigProvider>
</template>
