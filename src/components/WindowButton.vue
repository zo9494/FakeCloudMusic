<template>
  <div class="buttons">
    <button @click="handleMinimize">
      <i class="icon-fluent icon-fluent-chrome-minimize" />
    </button>
    <button @click="handleResizable">
      <i v-if="isMaximized" class="icon-fluent icon-fluent-chrome-restore" />
      <i v-else class="icon-fluent icon-fluent-chrome-maximize" />
    </button>
    <button class="close" @click="createAskDialog">
      <i class="icon-fluent icon-fluent-chrome-close" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { useDialog } from 'naive-ui';
import CloseComponent from '@/components/CloseTip.vue';

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

function handleClose() {
  window.electron.ipcRenderer.invoke('WINDOW_CLOSE');
}
function handleMinimizeToTray() {
  setTimeout(() => {
    window.electron.ipcRenderer.invoke('MINIMIZE_TO_TRAY');
  }, 180);
}

//
interface comfirmDataType {
  isRemember?: boolean;
  selectClose?: boolean;
}
let closeInfo: comfirmDataType = JSON.parse(localStorage.close) || {};

function onAfterLeave() {}
function createAskDialog() {
  if (!closeInfo.isRemember) {
    dialog.create({
      showIcon: false,
      autoFocus: false,
      closeOnEsc: false,
      maskClosable: false,
      // closable: false,
      transformOrigin: 'center',
      onAfterLeave,
      content() {
        return h(CloseComponent, {
          confirm: dialogConfirm,
          closeInfo,
        });
      },
    });
  }
  if (closeInfo.isRemember && closeInfo.selectClose) {
    handleClose();
  } else if (closeInfo.isRemember && !closeInfo.selectClose) {
    handleMinimizeToTray();
  }
}

function dialogConfirm(val: comfirmDataType) {
  dialog.destroyAll();
  if (val.isRemember) {
    // remember
    localStorage.close = JSON.stringify(val);
    closeInfo = val;
  }
  if (val.selectClose) {
    handleClose();
  } else {
    handleMinimizeToTray();
  }
}

window.electron.ipcRenderer.on('BEFORE_CLOSE', () => {
  if (!closeInfo.isRemember) {
    window.electron.ipcRenderer.invoke('WINDOW_SHOW');
  }
  createAskDialog();
});
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
