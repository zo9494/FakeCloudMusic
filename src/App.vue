<script setup lang="ts">
import AppBar from "./components/AppBar.vue"
import ScrollBar from "./components/ScrollBar.vue"
import Menu from "./components/Menu.vue"
import { RouterView } from "vue-router"
import UserLogin from "./components/UserLogin.vue"
</script>

<template>
  <AppBar></AppBar>
  <div class="container">
    <div className="container-left-nav">
      <div className="user">
        <UserLogin />
      </div>
      <ScrollBar>
        <Menu></Menu>
      </ScrollBar>
    </div>



    <div className="container-right-view">
      <RouterView></RouterView>
    </div>
    <div className="container-player">

    </div>
  </div>
</template>

<style lang="scss">
.container {
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: 160px auto;
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
