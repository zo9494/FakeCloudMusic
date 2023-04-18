<script setup lang="ts">
import {
  NConfigProvider,
  GlobalThemeOverrides,
  NDialogProvider,
} from 'naive-ui';

import App from './App.vue';

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
</script>

<template>
  <NConfigProvider
    tag="main"
    class="container"
    :theme-overrides="themeOverrides"
  >
    <NDialogProvider>
      <App></App>
    </NDialogProvider>
  </NConfigProvider>
</template>
