<template>
  <div class="playlist">
    <RecycleScroller
      class="scrollbar scroller"
      key-field="id"
      :items="data.playlist.tracks || []"
      :item-size="40"
      :min-item-size="40"
    >
      <template #before>
        <div>
          <Transition name="fade-slide-down">
            <div v-show="isFixed" class="playlist-header-fixed">
              <div class="title">{{ data.playlist.name }}</div>
              <div class="options">
                <button class="options-all" @click="handleDev">
                  <i class="bi bi-play-fill"></i>
                </button>
                <button
                  @click="handleDev"
                  :class="`options-collect ${
                    profile.userId === data.playlist.userId ? 'disable' : null
                  }`"
                >
                  <i class="bi bi-folder-check"></i>
                </button>
                <button @click="handleDev" class="optins-share">
                  <i class="bi bi-share"></i>
                </button>
                <button @click="handleDev" class="options-download">
                  <i class="bi bi-download"></i>
                </button>
              </div>
            </div>
          </Transition>
          <div class="playlist-header" ref="playlistHeaderRef">
            <div class="playlist-header-left">
              <Image :src="data.playlist.coverImgUrl" class="cover" />
            </div>

            <div class="playlist-header-right">
              <div class="title">{{ data.playlist.name }}</div>
              <div class="create-info">
                <div class="creator">
                  <Avatar :src="data.playlist.creator?.avatarUrl" />
                  <span>{{ data.playlist.creator?.nickname }}</span>
                </div>
                <span class="create-time"
                  >{{ formatDate(data.playlist.createTime) }}创建</span
                >
              </div>
              <div class="options">
                <button class="options-all">
                  <div @click="handleDev" class="options-all-left">
                    <i class="bi bi-play-circle"></i>
                    <span>播放全部</span>
                  </div>
                  <div @click="handleDev" class="options-all-right">
                    <i class="bi bi-plus-lg"></i>
                  </div>
                </button>
                <button
                  @click="handleDev"
                  :class="`options-collect ${
                    profile.userId === data.playlist.userId ? 'disable' : null
                  }`"
                >
                  <i class="bi bi-folder-check"></i>

                  <span v-if="data.playlist.subscribed"
                    >已收藏({{
                      formatNumber(data.playlist.subscribedCount)
                    }})</span
                  >
                  <span v-else
                    >收藏({{
                      formatNumber(data.playlist.subscribedCount)
                    }})</span
                  >
                </button>
                <button @click="handleDev" class="optins-share">
                  <i class="bi bi-share"></i>
                  <span
                    >分享 ({{ formatNumber(data.playlist.shareCount) }})</span
                  >
                </button>
                <button @click="handleDev" class="options-download">
                  <i class="bi bi-download"></i>
                  <span>下载全部</span>
                </button>
              </div>
              <div class="tags"
                >标签:
                <span
                  class="tags-item"
                  v-for="item in data.playlist.tags"
                  :key="item"
                  >{{ item }}</span
                >
              </div>
              <div class="count">
                歌曲数：<span>{{ data.playlist.trackCount }}</span>
                播放数：<span>{{ formatNumber(data.playlist.playCount) }}</span>
              </div>
              <div class="desc">
                <span>简介：</span>
                <Ellipsis
                  v-if="data.playlist.description"
                  class="desc-content"
                  :content="data.playlist.description"
                />
              </div>
            </div>
          </div>

          <div class="playlist-opt">
            <FInput
              class="playlist-opt-input"
              v-model="value"
              placeholder="搜索歌单歌曲"
            />
          </div>

          <div class="playlist-list-header">
            <div></div>
            <div></div>
            <div>音乐标题</div>
            <div>歌手</div>
            <div>专辑</div>
            <div>时长</div>
          </div>
        </div>
      </template>
      <template #after>
        <div>
          <div class="app-bottom-space"> </div>
          <div v-if="data.loading" class="loading">
            <div class="loading-content">
              <LoadingSVG width="20px" height="20px"></LoadingSVG>
              <span>加载中...</span>
            </div>
          </div>
          <div v-if="data.netErr" class="net-err"
            >网络不给力哦，请检查你的网络设置~</div
          >
        </div>
      </template>
      <template v-slot="{ item, index }">
        <div
          :class="{ 'playlist-list-item': true, color: item.index % 2 }"
          :key="item.id"
          @dblclick="handlePlay(index, data.playlist.tracks)"
        >
          <div class="index">{{ item.index }}</div>
          <div class="opt">
            <i
              v-if="userStore.hasLike(item.id)"
              @click="updateLike(item, true)"
              class="bi bi-heart-fill"
            ></i>
            <i v-else @click="updateLike(item)" class="bi bi-heart"></i>
            <i @click="handleDev" class="bi bi-download"></i>
          </div>
          <div
            class="text-overflow name"
            :title="item.origin_name"
            v-html="item.name"
          />
          <div
            class="text-overflow ar"
            :title="item.ar.map((it:Base) => it.origin_name).join('/')"
          >
            <span v-for="ar in item.ar" :key="ar.id" v-html="ar.name" />
          </div>
          <div class="text-overflow al">
            <span v-html="item.al.name" :title="item.al.origin_name" />
          </div>
          <div class="text-overflow dt">{{ formatDuring(item.dt) }}</div>
        </div>
      </template>
    </RecycleScroller>
  </div>
</template>

<script setup lang="ts">
import Image from '@/components/PlaylistImage.vue';
import FInput from '@/components/Input.vue';
import Avatar from '@/components/Avatar.vue';
import Ellipsis from '@/components/Ellipsis.vue';
import LoadingSVG from '@/assets/svg/loading.svg?component';
import { RecycleScroller } from 'vue-virtual-scroller';
import {
  onBeforeMount,
  onMounted,
  watch,
  reactive,
  ref,
  WatchStopHandle,
  nextTick,
} from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { cloneDeep, throttle } from 'lodash';

import { getPlaylistDetail } from '@/api/playlist';
import { useUserStore } from '@/store/user';
import { usePlayerStore } from '@/store/player';

import { formatDate, formatDuring } from '@/utils/time';
import { formatNumber } from '@/utils/number';

const userStore = useUserStore();
const { profile } = storeToRefs(userStore);
const route = useRoute();

const playerStore = usePlayerStore();

interface PlaylistDetail {
  playlist: Partial<Playlist>;
  netErr: boolean;
  loading: boolean;
  observer?: IntersectionObserver;
  watchFlag?: WatchStopHandle;
}

let origin: Track[] = [];

const data = reactive<PlaylistDetail>({
  playlist: {
    tracks: [],
  },
  netErr: false,
  loading: false,
});
async function loadPlaylist(params: { id: string }) {
  data.netErr = false;
  data.loading = true;
  if (params.id === 'like') {
    data.watchFlag = watch(
      () => userStore.userPlaylist.tracks,
      loadPlaylistFromStore,
      {
        immediate: true,
      }
    );
  } else {
    data.watchFlag?.();
  }
  try {
    const res = await getPlaylistDetail(params);
    if (!res?.playlist) {
      return;
    }
    const { playlist } = res;
    setPlaylist(playlist);
  } catch (error) {
    data.netErr = true;
  } finally {
    data.loading = false;
  }
}

function loadPlaylistFromStore() {
  const playlist = { ...userStore.userPlaylist };
  if (playlist.tracks) {
    setPlaylist(playlist as Playlist);
  }
}

function setPlaylist(playlist: Playlist) {
  playlist.tracks.forEach((song, index) => {
    song.index = index + 1;
    song.origin_name = song.name;
    // ar
    song.ar.forEach(it => {
      it.origin_name = it.name;
    });
    // al
    song.al.origin_name = song.al.name;
  });
  data.playlist = playlist;
  origin = playlist.tracks;
}

function resetData() {
  data.playlist = {};
  data.netErr = false;
}

onBeforeMount(() => {
  loadPlaylist({
    id: route.params.id as string,
  });
});
watch<string>(
  () => route.params.id as string,
  id => {
    resetData();
    nextTick(() => {
      loadPlaylist({ id });
    });
  }
);

//#region 歌单头部固定
/**
 *
 * @param rootEl class name
 */
function useHeaderAutoFixed(rootEl: string) {
  const childRef = ref<HTMLDivElement>();
  const isFixed = ref(false);
  const intersectionObserverCallback = (
    entries: IntersectionObserverEntry[]
  ) => {
    if (entries[0].intersectionRatio === 0) {
      isFixed.value = true;
    } else {
      isFixed.value = false;
    }
  };
  onMounted(() => {
    if (childRef.value) {
      const observer = new window.IntersectionObserver(
        intersectionObserverCallback,
        {
          root: document.querySelector(rootEl),
          rootMargin: '0px 0px 80px 0px',
        }
      );
      observer.observe(childRef.value);
    }
  });
  return { isFixed, childRef };
}

const { isFixed, childRef: playlistHeaderRef } = useHeaderAutoFixed(
  '.container-right-view'
);
//#endregion

//#region 在本地歌单中搜索
function useSearch(data: PlaylistDetail) {
  const searchVal = ref('');
  const search = () => {
    if (!searchVal.value) {
      data.playlist.tracks = origin;
      return;
    }
    if (origin) {
      const replaceValue = `<span class="s">$1</span>`;
      const searchReg = new RegExp(`(${searchVal.value})`, 'ig');
      const tempTracks = cloneDeep(origin);
      let index = 1;
      data.playlist.tracks = tempTracks.filter(song => {
        let flag = false;
        // name
        const newName = song.name.replaceAll(searchReg, replaceValue);
        if (song.name !== newName) {
          flag = true;
          song.name = newName;
        }
        // ar
        song.ar = song.ar.map(it => {
          const newArName = it.name.replaceAll(searchReg, replaceValue);
          if (it.name !== newArName) {
            flag = true;
            it.name = newArName;
          }
          return it;
        });
        // al
        const newAlName = song.al.name.replaceAll(searchReg, replaceValue);
        if (song.al.name !== newAlName) {
          flag = true;
          song.al.name = newAlName;
        }

        if (flag) {
          song.index = index;
          index++;
        }
        return flag;
      });
    }
  };

  const searchThrottle = throttle(search, 500);
  watch(searchVal, val => {
    searchThrottle();
  });
  return { value: searchVal };
}
const { value } = useSearch(data);
//#endregion

function handlePlay(index: number, list?: Track[]) {
  playerStore.play(index, data.playlist.tracks);
}

// like
function updateLike(song: Track, isDel = false) {
  userStore.updateLike(song, isDel);
}

// dev
function handleDev() {
  window.alert('功能开发中...');
}
</script>

<style lang="scss" scoped>
.net-err {
  text-align: center;
  color: #666666;
  height: 30px;
  line-height: 30px;
}
.loading {
  color: #666;
  height: 100px;
  display: grid;
  place-items: center;
  &-content {
    display: flex;
    gap: 10px;
    align-items: center;
  }
}
.disable {
  color: var(--button-text-color-disabled);
  background-color: var(--button-color-disabled);
  opacity: var(--opacity-disabled);
  border: var(--button-border-disabled);
}

.playlist {
  font-size: 12px;
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
  .scroller {
    position: unset;
  }
  &-header-fixed {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background-color: var(--bg-color);
    padding: 20px;
    border-bottom: 1px solid var(--playlist-header-border-bottom-color);
    z-index: 10;
    .title {
      font-size: 22px;
      font-weight: bold;
      color: var(--font-color);
    }
    .options {
      margin: 10px 0;
      display: grid;
      grid-template-columns: repeat(4, 25px);
      gap: 20px;
      button {
        font-size: 18px;
        height: 25px;
        width: 25px;
        border-radius: 100%;
      }
      &-all {
        background-color: #e8002b;
        color: #fff;
      }
      &-collect {
        border: none;
      }
    }
  }
  &-header {
    padding: 0 20px;
    display: grid;
    grid-template-columns: 200px auto;
    gap: 10px;

    &-left {
      :deep(img) {
        border-radius: 10px;
      }

      .cover {
        width: 200px;
        height: 200px;
      }
    }

    &-right {
      display: grid;
      grid-template-rows: repeat(6, 1fr);
      grid-template-rows: auto repeat(2, 30px) repeat(6, auto);
      font-size: 12px;
      gap: 10px;

      .title {
        font-size: 22px;
        font-weight: bold;
        color: var(--font-color);
      }

      .create-info {
        display: flex;
        align-items: center;
        font-size: 12px;

        .creator {
          display: grid;
          grid-template-columns: 30px auto;
          grid-template-rows: 30px;
          align-items: center;
          gap: 5px;
        }

        .create-time {
          margin-left: 10px;
          color: #666666;
        }
      }

      .options {
        display: grid;
        grid-template-columns: 140px repeat(2, 130px) auto;
        gap: 10px;

        button {
          font-size: 13px;
          max-width: 140px;
          &:not(.options-all) {
            border-radius: 50px;
            background-color: var(--button-color);
            display: grid;
            grid-template-columns: 14px auto;
            place-items: center;
            padding-left: 10px;
            border: var(--button-border);
            &:not(.disable):hover {
              background-color: var(--app-bar-button-hover);
            }
          }
        }

        &-all {
          border: none;
          color: #fff;
          display: grid;
          grid-template-columns: auto 30px;
          align-items: center;

          &-left {
            background-color: #eb002e;
            height: 100%;
            display: grid;
            grid-template-columns: repeat(2, auto);
            border-radius: 50px 0 0 50px;
            place-items: center;
          }

          &-right {
            height: 100%;
            border-radius: 0 50px 50px 0;
            background-color: #eb002e;
            display: grid;
            place-items: center;
          }

          div[class^='options-all-'] {
            &:hover {
              background-color: #dd002d;
            }
          }
        }
      }

      .tags {
        &-item {
          color: #5071ae;

          &::after {
            display: inline;
            content: '/';
            color: #666;
            margin: 0 4px;
          }

          &:nth-last-of-type(1) {
            &::after {
              content: none;
            }
          }
        }
      }

      .count {
        span {
          color: #666;
        }
      }

      .desc {
        display: grid;
        grid-template-columns: 36px auto;
        &-content {
          color: #666;
        }
      }
    }
  }
  .playlist-list-header,
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

  &-opt {
    padding: 0 20px;
    display: flex;
    justify-content: flex-end;
    &-input {
      height: 22px;
      width: 180px;
    }
  }
}
</style>
