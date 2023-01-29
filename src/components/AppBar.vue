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


</script>
<style lang="scss" scoped>
.app_bar_place {
  display: grid;
  grid-template-columns: 200px auto;

  >div:nth-of-type(1) {
    background-color: #ededed;
  }
}

.drag {
  -webkit-app-region: drag;
}
</style>
