<template>
  <div class="buttons">
    <button @click="handleMinimize">
      <i class="icon-fluent icon-fluent-chrome-minimize" />
    </button>
    <button @click="handleResizable">
      <i v-if="isMaximized" class="icon-fluent icon-fluent-chrome-restore" />
      <i v-else class="icon-fluent icon-fluent-chrome-maximize" />
    </button>
    <button class="close" @click="handleClose">
      <i class="icon-fluent icon-fluent-chrome-close" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isMaximized = ref(false);

function handleMinimize() {
  window.electron.ipcRenderer.invoke('WINDOW_MIN');
}
function handleResizable() {
  window.electron.ipcRenderer.invoke('WINDOW_RESIZ');
}

function handleClose() {
  window.electron.ipcRenderer.invoke('WINDOW_CLOSE');
}

window.electron.ipcRenderer.on('MAXIMIZE', (e, val) => {
  isMaximized.value = val;
});
</script>

<style lang="scss" scoped>
.buttons {
  display: grid;
  grid-template-columns: repeat(3, auto);
  height: 100%;

  button {
    outline: none;
    outline-style: none;
    border: none;
    background-color: transparent;
    font-family: 'FluentIcon';
    font-size: 12px;
    height: 100%;

    i {
      // 缩小图标
      font-style: normal;
      transform: scale(0.8);
      display: inline-block;
    }
  }

  button:hover {
    background-color: var(--app-bar-button-hover);
  }

  .close:hover {
    background-color: #e81123;
    color: #fff;
  }
}
</style>
