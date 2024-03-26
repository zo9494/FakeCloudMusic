<script setup lang="ts">
import { useDialog, useMessage } from 'naive-ui';
import { h, onBeforeMount } from 'vue';
import AppBar from './components/AppBar.vue';
import Menu from './components/Menu.vue';
import UserLogin from './components/UserLogin.vue';
import Player from '@/views/Player.vue';
import { RouterView } from 'vue-router';
import { storeToRefs } from 'pinia';
import CloseComponent from '@/components/CloseTip.vue';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const { order } = storeToRefs(userStore);
onBeforeMount(() => {
  userStore.getUserAccount();
});
//#region 关闭对话框
const dialog = useDialog();
interface comfirmDataType {
  isRemember?: boolean;
  selectClose?: boolean;
}

function beforeLeaveDialog(data: comfirmDataType): Promise<comfirmDataType> {
  return new Promise((resolve, reject) => {
    dialog.create({
      showIcon: false,
      autoFocus: false,
      closeOnEsc: false,
      maskClosable: false,
      // closable: false,
      transformOrigin: 'center',
      content() {
        return h(CloseComponent, {
          confirm: (val: comfirmDataType) => {
            dialog.destroyAll();
            resolve(val);
          },
          data,
        });
      },
    });
  });
}

function handleCloseOrTray(selectClose?: boolean) {
  if (selectClose) {
    window.electron.ipcRenderer.invoke('APP_CLOSE');
  } else {
    setTimeout(() => {
      window.electron.ipcRenderer.invoke('MINIMIZE_TO_TRAY');
    }, 180);
  }
}
window.electron.ipcRenderer.on('BEFORE_CLOSE', async () => {
  let closeInfo: comfirmDataType = JSON.parse(localStorage.close || '{}');
  if (closeInfo.isRemember) {
    handleCloseOrTray(closeInfo.selectClose);
  } else {
    window.electron.ipcRenderer.invoke('WINDOW_SHOW');
    const res = await beforeLeaveDialog(closeInfo);
    console.log(res);
    if (res.isRemember) {
      // remember
      localStorage.close = JSON.stringify(res);
      closeInfo = res;
    }
    handleCloseOrTray(res.selectClose);
  }
});

//#endregion
window.loadUser = () => {
  console.log('loadUser');
  userStore.getUserAccount();
};
//
const message = useMessage();
window.$message = message;
window.electron.ipcRenderer.on('APP:SEND_MESSAGE', (_, val) => {
  message.create(val.text, {
    type: val.type,
  });
});
</script>

<template>
  <aside class="container-left-nav">
    <div class="drag"></div>
    <div class="user">
      <UserLogin />
    </div>
    <aside class="scrollbar">
      <Menu :menu="order"></Menu>
    </aside>
  </aside>
  <div class="container-right-view">
    <AppBar></AppBar>
    <div class="container-right-view-inner">
      <RouterView v-slot="{ Component, route }">
        <transition name="scale" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </RouterView>
    </div>
  </div>
  <div class="container-player">
    <Player />
  </div>
</template>

<style lang="scss">
.container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: 200px auto;
  .app-bottom-space {
    height: calc(variables.$appBottomSpace - 40px);
  }
  &-left-nav {
    overflow: hidden;
    display: grid;
    grid-template-rows: 20px 50px auto;
    background-color: var(--menu-color);
  }

  &-right-view {
    padding: 0 2px 0 2px;
    height: 100%;
    overflow: hidden;
    position: relative;
    &-inner {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }
  }

  &-player {
    width: 95vw;
    position: fixed;
    bottom: 20px;
    left: 50%;
    z-index: 10;
    transform: translateX(-50%);
  }

  .user {
    background-color: var(--menu-color);
  }
}
</style>
