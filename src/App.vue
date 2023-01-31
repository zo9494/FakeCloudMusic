<script setup lang="ts">
import AppBar from './components/AppBar.vue';
import ScrollBar from './components/ScrollBar.vue';
import Menu from './components/Menu.vue';
import UserLogin from './components/UserLogin.vue';
import Player from './components/Player.vue';

import { RouterView } from 'vue-router';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useUserStore } from '@/store/user';
const userStore = useUserStore();
const { order } = storeToRefs(userStore);

const showPlayer = ref(false);

window.loadUser = () => {
  console.log('loadUser');
  userStore.getUserAccount();
};
setTimeout(() => {
  showPlayer.value = true;
}, 5000);
</script>

<template>
  <AppBar></AppBar>
  <div class="container">
    <div class="container-left-nav">
      <div class="user">
        <UserLogin />
      </div>
      <ScrollBar>
        <Menu :menu="order"></Menu>
        <div style="height: 80px"></div>
      </ScrollBar>
    </div>
    <ScrollBar class="container-right-view" way="always">
      <RouterView></RouterView>
      <div style="height: 80px"></div>
    </ScrollBar>
    <Transition name="slide-up">
      <div v-show="showPlayer" class="container-player">
        <Player />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss">
.container {
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: 200px auto;
  grid-template-rows: auto;

  &-left-nav {
    overflow: hidden;
    display: grid;
    grid-template-rows: 50px auto;
    background-color: #ededed;
  }

  // &-right-view {}

  &-player {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    grid-column: 1/3;
    height: 60px;
  }

  .user {
    background-color: #ebebeb;
  }
}
</style>
