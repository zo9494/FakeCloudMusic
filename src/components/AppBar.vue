<template>
  <div :class="`app_bar_place ${dragClassName}`">
    <div></div>
    <div></div>
  </div>
  <component :is="appBar" />
</template>

<script lang="ts" setup>
import WinTitleBar from './WinTitleBar.vue';
import type { DefineComponent } from "vue";
let appBar: undefined | DefineComponent<{}, {}, any>
let dragClassName = 'drag'
if (process.platform === 'win32') {
  appBar = WinTitleBar;
  dragClassName = ''
}
console.log(process);
</script>
<style lang="scss" scoped>
.app_bar_place {
  display: grid;
  <<<<<<< HEAD grid-template-columns: 200px auto;
  -webkit-app-region: drag;
  =======grid-template-columns: 160px auto;

  >>>>>>>550f8eaa331e307ff9abb3363a54521165f4b26f>div:nth-of-type(1) {
    background-color: #ededed;
  }
}

.drag {
  -webkit-app-region: drag;
}
</style>
