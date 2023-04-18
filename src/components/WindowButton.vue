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
import { ref, h } from 'vue';
import { useDialog } from 'naive-ui';
import CloseTip from '@/components/CloseTip.vue';

const isMaximized = ref(false);
const dialog = useDialog();

function handleMinimize() {
  window.electron.ipcRenderer.invoke('WINDOW_MIN');
  // window.electron.window.minimize();
}
function handleResizable() {
  window.electron.ipcRenderer.invoke('WINDOW_RESIZ');
  // window.electron.window.resizable();
}

//
let close: boolean | null = null;
let tip: boolean = true;
function confirm(val: boolean | null = null) {
  dialog.destroyAll();
  close = val;
}
function onAfterLeave() {
  if (close === null) {
    return;
  }
  if (close) {
    // window.electron.window.close(true);
    window.electron.ipcRenderer.invoke('WINDOW_CLOSE', true);
  } else {
    setTimeout(() => {
      window.electron.ipcRenderer.invoke('MINIMIZE_TO_TRAY');
      // window.electron.window.minimizeToTray();
    }, 150);
  }
}
function handleClose() {
  if (tip) {
    dialog.create({
      showIcon: false,
      autoFocus: false,
      closeOnEsc: false,
      maskClosable: false,
      // closable: false,
      transformOrigin: 'center',
      onAfterLeave,
      content() {
        return h(CloseTip, {
          confirm,
        });
      },
      onClose() {
        confirm();
      },
    });
  } else {
    onAfterLeave();
  }
}

// window.electron.window.beforeClose(() => {
//   window.electron.window.show();
//   handleClose();
// });

window.electron.ipcRenderer.on('BEFORE_CLOSE', () => {
  window.electron.ipcRenderer.invoke('WINDOW_SHOW');
  handleClose();
});
window.electron.ipcRenderer.on('MAXIMIZE', (e, val) => {
  isMaximized.value = val;
});
// window.electron.window.maximizeChange(val => {
//   isMaximized.value = val;
// });
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
