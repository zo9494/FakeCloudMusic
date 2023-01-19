<template>
  <div class="nav-item" v-for="item in menu">
    <span class="nav-item-title " v-text="item"></span>
    <ul>
      <li v-for="item_menu in 10">
        <RouterLink :to="`/id/${item_menu}`">menu-item-{{ item_menu }}</RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router"

const menu = [
  undefined, "我的音乐", "创建的歌单", "收藏的歌单"
]

</script>
