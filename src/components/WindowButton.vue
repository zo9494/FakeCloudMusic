<template>
  <div class="buttons">
    <button @click="handleMinimize">
      <i>&#xe921;</i>
    </button>
    <button @click="handleResizable">
      <i v-if="isMaximized">&#xe923;</i> <i v-else>&#xe922;</i>
    </button>
    <button class="close" @click="handleClose">
      <i>&#xe8bb;</i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const isMaximized = ref(false);

function handleMinimize() {
  window.electron.window.minimize();
}
function handleResizable() {
  window.electron.window.resizable().then(value => {
    isMaximized.value = value;
  });
}
function handleClose() {
  window.electron.window.close();
}
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
    background-color: rgba(0, 0, 0, 0.1);
  }

  .close:hover {
    background-color: #e81123;
    color: #fff;
  }
}
</style>
