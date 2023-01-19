<template>
  <component :is="appBar" />
</template>

<script lang="ts" setup>
import WinTitleBar from './WinTitleBar.vue';
import { h, defineComponent } from 'vue';
let appBar = defineComponent({
  render() {
    return h('div', {
      style: '-webkit-app-region: drag;background-color: transparent;',
    });
  },
});
if (process.platform === 'win32') {
  appBar = WinTitleBar;
}
console.log(process);
</script>
