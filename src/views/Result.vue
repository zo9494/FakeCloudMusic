<template>
  <div class="result scrollbar">
    <p class="result-title">搜索 {{ route.params.keywords }}</p>
    <div class="content">
      <div
        v-for="(item, index) in list"
        :class="{ 'playlist-list-item': true, color: index % 2 }"
        :key="item.id"
        @dblclick="handlePlay(index, list)"
      >
        <div class="index">{{ index + 1 }}</div>
        <div class="opt">
          <i
            v-if="userStore.hasLike(item.id)"
            @click="updateLike(item, true)"
            class="bi bi-heart-fill"
          ></i>
          <i v-else @click="updateLike(item)" class="bi bi-heart"></i>
          <i @click="download(item)" class="bi bi-download"></i>
        </div>
        <div
          class="text-overflow name"
          :title="item.origin_name"
          v-html="item.name"
        />
        <div
          class="text-overflow ar"
          :title="item.artists.map((it:Base) => it.origin_name).join('/')"
        >
          <span
            v-for="artists in item.artists"
            :key="artists.id"
            v-html="artists.name"
          />
        </div>
        <div class="text-overflow al">
          <span v-html="item.album.name" :title="item.album.origin_name" />
        </div>
        <div class="text-overflow dt">{{ formatDuring(item.duration) }}</div>
      </div>
    </div>
    <div></div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { formatDate, formatDuring } from '@/utils/time';
import { useRoute } from 'vue-router';
import { service } from '@/utils/request';
import { useDialog } from 'naive-ui';
import { download } from '@/utils/utils';
const dialog = useDialog();

const route = useRoute();
const list = ref();

import { useUserStore } from '@/store/user';
const userStore = useUserStore();

import { usePlayerStore } from '@/store/player';
const playerStore = usePlayerStore();

service
  .get<Search.RootObject>('/search', {
    params: { keywords: route.params.keywords },
  })
  .then(res => {
    console.log(res.result);
    list.value = res.result.songs;
  });

function updateLike(song: Track, isDel = false) {
  userStore.updateLike(song, isDel);
}

function handleDev() {
  window.alert('功能开发中...');
}

function handlePlay(index: number, list?: Track[]) {
  playerStore.play(index, list);
}
</script>

<style scoped lang="scss">
.result {
  padding: 0 0 200px 0;
  &-title {
    margin: 0;
    font-size: 16px;
    font-weight: bolder;
  }
  .content {
    overflow: hidden;
    // height: 100px;
  }
  .playlist-list-item {
    box-sizing: border-box;
    height: 40px;
    line-height: 40px;
    padding: 0 20px;
    display: grid;
    gap: 15px;
    grid-template-columns: 20px 50px auto repeat(2, 120px) 50px;
  }
  .playlist-list {
    &-header {
      color: #888888;
      border-bottom: 1px solid var(--playlist-item-header-border-color);
    }

    &-item {
      &.color {
        background-color: var(--playlist-item-eve-color);
      }

      &:hover {
        background-color: var(--playlist-item-hover-color);
      }
      .index {
        color: var(--playlist-item-index-font-color);
      }

      .opt {
        height: 100%;
        display: grid;
        grid-template-columns: repeat(2, auto);
        place-items: center;
        gap: 4px;
        color: var(--playlist-item-index-font-color);
        .bi {
          cursor: pointer;
        }
      }

      .name {
        color: var(--playlist-item-name-font-color);
      }

      .ar {
        color: var(--playlist-item-ar-font-color);

        span {
          cursor: pointer;

          &::after {
            content: '/';
            margin: 0 4px;
          }

          &:nth-last-of-type(1) {
            &::after {
              content: none;
            }
          }
        }
      }

      .al {
        color: var(--playlist-item-al-font-color);

        span {
          cursor: pointer;
        }
      }

      .dt {
        color: var(--playlist-item-dt-font-color);
      }
    }
  }
}
</style>
