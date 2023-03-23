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
  Dialog: {
    closeMargin: '5px',
    padding: '10px',
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
