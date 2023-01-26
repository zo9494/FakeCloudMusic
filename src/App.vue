<script setup lang="ts">
import AppBar from "./components/AppBar.vue"
import ScrollBar from "./components/ScrollBar.vue"
import Menu from "./components/Menu.vue"
import { RouterView } from "vue-router"
import UserLogin from "./components/UserLogin.vue"
import { storeToRefs } from "pinia";
import { useUserStore } from "@/store/user";
const userStore = useUserStore();
const { order } = storeToRefs(userStore)

window.loadUser = () => {
  console.log('loadUser');
  userStore.getUserAccount()
}
</script>

<template>
  <AppBar></AppBar>
  <div class="container">
    <div class="container-left-nav">
      <div class="history">
        <button class="history-back history-button disabled">
          <SvgIcon class="icon-chevron" name="chevron-left" />
        </button>
        <button class="history-forward history-button">
          <SvgIcon class="icon-chevron" name="chevron-right" />
        </button>
      </div>
      <div class="user">
        <UserLogin />
      </div>
      <ScrollBar>
        <Menu :menu="order"></Menu>
      </ScrollBar>
    </div>
    <div class="container-right-view">
      <RouterView></RouterView>
    </div>
    <div class="container-player">

    </div>
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
    grid-template-rows: 25px 50px auto;
    background-color: #ededed;

    .history {
      display: grid;
      grid-template-columns: 25px 25px;
      justify-content: flex-end;
      gap: 20px;
      align-items: center;

      .history-button {
        display: grid;
        justify-items: center;
        align-items: center;
        border-radius: 50%;
        height: 100%;

        &:not(.disabled):hover {
          background-color: rgba(46, 50, 56, 0.05);

        }
      }

      .icon-chevron {
        width: 16px;
        height: 16px;
      }
    }
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
