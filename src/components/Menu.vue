<template>
  <div class="nav-item">
    <ul>
      <li>
        <RouterLink draggable="false" to="/">
          <NeteaseLogoSVG class="netease_logo" />
          <span>发现音乐</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink draggable="false" to="/播客">
          <i class="bi bi-broadcast" />
          <span>播客</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink draggable="false" to="/私人FM">
          <RadioSVG class="radio_svg" />
          <span>私人FM</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink draggable="false" to="/视频">
          <i class="bi bi-camera-video" />
          <span>视频</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink draggable="false" to="/关注">
          <i class="bi bi-people" />
          <span>关注</span>
        </RouterLink>
      </li>
    </ul>
  </div>
  <div class="nav-item">
    <div class="nav-item-title">我的音乐</div>
    <ul>
      <li>
        <RouterLink draggable="false" :to="`/playlist/${menu.myLike.id}`">
          <i class="bi bi-heart" />
          <span>我喜欢的音乐</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink draggable="false" to="/下载管理">
          <i class="bi bi-download" />
          <span>下载管理</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink draggable="false" to="/最近播放">
          <i class="bi bi-clock-history" />
          <span>最近播放</span>
        </RouterLink>
      </li>
    </ul>
  </div>
  <div class="nav-item">
    <div class="nav-item-title">创建的歌单</div>
    <ul>
      <li v-for="item in menu.myCreate" :key="item.id">
        <RouterLink draggable="false" :to="`/playlist/${item.id}`">
          <i class="bi bi-music-note-list" />
          <span class="text-overflow">{{ item.name }}</span>
        </RouterLink>
      </li>
    </ul>
  </div>
  <div class="nav-item">
    <div class="nav-item-title">收藏的歌单</div>
    <ul>
      <li v-for="item in menu.myCollect" :key="item.id">
        <RouterLink draggable="false" :to="`/playlist/${item.id}`">
          <i class="bi bi-music-note-list" />
          <span class="text-overflow">{{ item.name }}</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue';
import { RouterLink } from 'vue-router';
import NeteaseLogoSVG from '@/assets/svg/netease_logo.svg?component';
import RadioSVG from '@/assets/svg/radio.svg?component';
interface menuType {
  menu: {
    myLike: Partial<Order>;
    myCreate: Playlist[];
    myCollect: Playlist[];
  };
}
const { menu } = withDefaults(defineProps<menuType>(), {
  menu: () => ({
    myLike: {},
    myCreate: [],
    myCollect: [],
  }),
});
</script>
<style lang="scss" scoped>
.nav-item {
  &-title {
    margin-left: 15px;
    color: #888888;
    font-size: 12px;
    padding: 5px 0;
  }

  li {
    .netease_logo {
      width: 35px;
      height: 30px;
    }
    .radio_svg {
      width: 35px;
    }
    .bi {
      font-size: 17px;
      text-align: center;
      &-heart {
        font-size: 16px;
      }
    }

    &:hover {
      background-color: variables.$menuHover;
    }

    a {
      height: 35px;
      display: grid;
      grid-template-columns: 35px auto;
      align-items: center;
      padding-left: 15px;
      font-size: 13px;
      line-height: 35px;
      overflow: hidden;
    }
  }
}

.router-link-exact-active {
  color: #e40029;
  background-color: variables.$menuActive;
}
</style>
