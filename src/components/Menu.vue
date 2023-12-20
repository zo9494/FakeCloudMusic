<template>
  <div class="nav-item">
    <ul>
      <li @click="handleClick('/', $event)">
        <div draggable="false">
          <NeteaseLogoSVG class="svg-netease_logo" />
          <span>发现音乐</span>
        </div>
      </li>
      <li @click="handleClick('/播客', $event)">
        <div draggable="false">
          <i class="bi bi-broadcast" />
          <span>播客</span>
        </div>
      </li>
      <li @click="handleClick('/私人FM', $event)">
        <div draggable="false">
          <RadioSVG class="svg-radio" />
          <span>私人FM</span>
        </div>
      </li>
      <li @click="handleClick('/视频', $event)">
        <div draggable="false">
          <i class="bi bi-play-btn" />
          <span>视频</span>
        </div>
      </li>
      <li @click="handleClick('/关注', $event)">
        <div draggable="false">
          <i class="bi bi-people" />
          <span>关注</span>
        </div>
      </li>
    </ul>
  </div>
  <div class="nav-item">
    <div class="nav-item-title">我的音乐</div>
    <ul>
      <li @click="handleClick('/playlist/like', $event)">
        <div draggable="false">
          <i class="bi bi-heart" />
          <span>我喜欢的音乐</span>
        </div>
      </li>
      <li @click="handleClick('/local', $event)">
        <div draggable="false">
          <i class="bi bi-music-note-beamed" />
          <span>本地音乐</span>
        </div>
      </li>
      <li @click="handleClick('/下载管理', $event)">
        <div draggable="false">
          <i class="bi bi-download" />
          <span>下载管理</span>
        </div>
      </li>
      <li @click="handleClick('/最近播放', $event)">
        <div draggable="false">
          <i class="bi bi-clock-history" />
          <span>最近播放</span>
        </div>
      </li>
    </ul>
  </div>
  <div class="nav-item">
    <div class="nav-item-title">创建的歌单</div>
    <ul>
      <li
        v-for="item in menu.myCreate"
        :key="item.id"
        @click="handleClick(`/playlist/${item.id}`, $event)"
      >
        <div draggable="false">
          <i class="bi bi-music-note-list" />
          <span class="text-overflow">{{ item.name }}</span>
        </div>
      </li>
    </ul>
  </div>
  <div class="nav-item">
    <div class="nav-item-title">收藏的歌单</div>
    <ul>
      <li
        v-for="item in menu.myCollect"
        :key="item.id"
        @click="handleClick(`/playlist/${item.id}`, $event)"
      >
        <div draggable="false">
          <i class="bi bi-music-note-list" />
          <span class="text-overflow">{{ item.name }}</span>
        </div>
      </li>
    </ul>
  </div>
  <div class="app-bottom-space"></div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import NeteaseLogoSVG from '@/assets/svg/netease_logo.svg?component';
import RadioSVG from '@/assets/svg/radio.svg?component';
interface menuType {
  menu: {
    myLike: Partial<Order>;
    myCreate: Playlist[];
    myCollect: Playlist[];
  };
}
const router = useRouter();
const { menu } = withDefaults(defineProps<menuType>(), {
  menu: () => ({
    myLike: {},
    myCreate: [],
    myCollect: [],
  }),
});

function handleClick(to: string, e: Event) {
  (
    window.document.querySelector('.active') as HTMLButtonElement
  )?.classList.remove('active');

  (e.currentTarget as HTMLButtonElement).classList.add('active');
  router.push({ path: to });
}
</script>
<style lang="scss" scoped>
.nav-item {
  &-title {
    margin-left: 15px;
    color: var(--menu-title-color);
    font-size: 12px;
    padding: 5px 0;
  }

  li {
    .svg {
      &-netease_logo {
        width: 35px;
        height: 30px;
      }
      &-radio {
        width: 35px;
      }
    }

    .bi {
      font-size: 17px;
      text-align: center;
      &-heart {
        font-size: 16px;
      }
    }

    &:hover {
      background-color: var(--menu-hover-bg-color);
    }

    div {
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

.active {
  color: #e40029;
  background-color: var(--menu-active-bg-color);
}
</style>
