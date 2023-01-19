<template>
  <div class="app_bar_place">
    <div></div>
    <div></div>
  </div>
  <component :is="appBar" />
</template>

<script lang="ts" setup>
import WinTitleBar from './WinTitleBar.vue';
let appBar;
if (process.platform === 'win32') {
  appBar = WinTitleBar;
}
console.log(process);
</script>
<style lang="scss" scoped>
.app_bar_place {
  display: grid;
  grid-template-columns: 160px auto;
  -webkit-app-region: drag;

  >div:nth-of-type(1) {
    background-color: #ededed;
  }
}
</style>
