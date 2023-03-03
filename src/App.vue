<script setup lang="ts">
import AppBar from './components/AppBar.vue';
import ScrollBar from './components/ScrollBar.vue';
import Menu from './components/Menu.vue';
import UserLogin from './components/UserLogin.vue';
import Player from '@/views/Player.vue';

import { RouterView } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const { order } = storeToRefs(userStore);

window.loadUser = () => {
  console.log('loadUser');
  userStore.getUserAccount();
};
</script>

<template>
  <AppBar></AppBar>
  <div class="container-left-nav">
    <div class="user">
      <UserLogin />
    </div>
    <ScrollBar>
      <Menu :menu="order"></Menu>
      <div style="height: 80px"></div>
    </ScrollBar>
  </div>
  <div class="container-right-view">
    <ScrollBar way="always">
      <RouterView></RouterView>
      <div style="height: 80px"></div>
    </ScrollBar>
  </div>
  <div class="container-player">
    <Player />
  </div>
  <!-- <div class="container">
    <div class="container-left-nav">
      <div class="user">
        <UserLogin />
      </div>
      <ScrollBar>
        <Menu :menu="order"></Menu>
        <div style="height: 80px"></div>
      </ScrollBar>
    </div>
    <div class="container-right-view">
      <ScrollBar way="always">
        <RouterView></RouterView>
        <div style="height: 80px"></div>
      </ScrollBar>
    </div>
    <div class="container-player">
      <Player />
    </div>
  </div> -->
</template>

<style lang="scss">
.container {
  grid-row: 3/4;
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: 200px auto;
  grid-template-rows: auto;

  &-left-nav {
    grid-row: 2/4;
    overflow: hidden;
    display: grid;
    grid-template-rows: 50px auto;
    background-color: variables.$appBgColor;
  }

  &-right-view {
    grid-row: 3/4;
    height: 100%;
    position: relative;
    overflow: hidden;
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
