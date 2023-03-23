<script setup lang="ts">
import { h } from 'vue';
import { useDialog } from 'naive-ui';
import AppBar from './components/AppBar.vue';
import ScrollBar from './components/ScrollBar.vue';
import Menu from './components/Menu.vue';
import UserLogin from './components/UserLogin.vue';
import Player from '@/views/Player.vue';
import CloseTip from '@/components/CloseTip.vue';
import { RouterView } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const { order } = storeToRefs(userStore);
const dialog = useDialog();
window.loadUser = () => {
  console.log('loadUser');
  userStore.getUserAccount();
};
let afterClose: Promise<boolean>;
function confirm(val: boolean) {
  dialog.destroyAll();
  afterClose = Promise.resolve(val);
}
function onAfterLeave() {
  afterClose.then(value => {
    if (value) {
      window.electron.window.close(true);
    } else {
      window.electron.window.minimizeToTray();
    }
  });
}
window.electron.window.beforeClose(function () {
  console.log('from main: before-close');
  dialog.create({
    showIcon: false,
    autoFocus: false,
    // closable: false,
    transformOrigin: 'center',
    onAfterLeave,
    content: () =>
      h(CloseTip, {
        confirm,
      }),
  });
});
</script>

<template>
  <aside class="container-left-nav">
    <div class="drag"></div>
    <div class="user">
      <UserLogin />
    </div>
    <ScrollBar>
      <Menu :menu="order"></Menu>
      <div style="height: 80px"></div>
    </ScrollBar>
  </aside>
  <div class="container-right-view">
    <AppBar></AppBar>
    <div class="container-right-view-inner">
      <ScrollBar way="always">
        <RouterView></RouterView>
        <div style="height: 80px"></div>
      </ScrollBar>
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

  &-left-nav {
    overflow: hidden;
    display: grid;
    grid-template-rows: 20px 50px auto;
    background-color: variables.$appBgColor;
  }

  &-right-view {
    padding: 40px 2px 0 2px;
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
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
  }

  .user {
    background-color: variables.$appBgColor;
  }
}
</style>
