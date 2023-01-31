<script setup lang="ts">
import AppBar from './components/AppBar.vue';
import ScrollBar from './components/ScrollBar.vue';
import Menu from './components/Menu.vue';
import { RouterView } from 'vue-router';
import UserLogin from './components/UserLogin.vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/user';
const userStore = useUserStore();
const { order } = storeToRefs(userStore);

window.loadUser = () => {
  console.log('loadUser');
  userStore.getUserAccount()
};

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
      </ScrollBar>
    </div>
    <div class="container-right-view scrollbar-always">
      <RouterView></RouterView>
    </div>
    <div class="container-player"> </div>
  </div>
</template>

<style lang="scss">
.container {
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: 200px auto;
  grid-template-rows: auto 50px;

  &-left-nav {
    overflow: hidden;
    display: grid;
    grid-template-rows: 50px auto;
    background-color: #ededed;
  }

  // &-right-view {}

  &-player {
    height: 50px;
    grid-column: 1/3;
    background-color: red;
    border: 1px solid saddlebrown;
  }

  .user {
    background-color: #ebebeb;
  }
}
</style>
