<template>
  <div :class="`app_bar_place ${dragClassName}`">
    <div></div>
    <div></div>
  </div>
  <component :is="appBar" />
</template>

<script lang="ts" setup>
import WinTitleBar from './WinTitleBar.vue';
let appBar;
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

  grid-template-columns: 160px auto;

  >div:nth-of-type(1) {
    background-color: #ededed;
  }
}

.drag {
  -webkit-app-region: drag;
}
</style>
