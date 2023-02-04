<template>
  <div class="playlist">
    <div class="playlist-header">
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
            <div class="options-all-left">
              <SvgIcon name="play-circle" class="icon-bootstrap" />
              <span>播放全部</span>
            </div>
            <div class="options-all-right">
              <SvgIcon name="plus" class="icon-bootstrap plus" />
            </div>
          </button>
          <button
            :class="`options-collect ${
              profile.userId === data.playlist.userId ? 'disable' : null
            }`"
          >
            <SvgIcon name="folder-check" class="icon-bootstrap" />

            <span v-if="data.playlist.subscribed"
              >已收藏({{ formatNumber(data.playlist.subscribedCount) }})</span
            >
            <span v-else
              >收藏({{ formatNumber(data.playlist.subscribedCount) }})</span
            >
          </button>
          <button class="optins-share">
            <SvgIcon name="share" class="icon-bootstrap" />
            <span>分享 ({{ formatNumber(data.playlist.shareCount) }})</span>
          </button>
          <button class="options-download">
            <SvgIcon name="download" class="icon-bootstrap" />
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
          歌曲数：<span>{{ data.playlist.trackCount }}</span> 播放数：<span>{{
            formatNumber(data.playlist.playCount)
          }}</span>
        </div>
        <div class="desc text-overflow"
          >简介：
          <span>{{ data.playlist.description }}</span>
        </div>
      </div>
    </div>

    <div class="playlist-opt">
      <FCInput v-model="searchVal" placeholder="搜索歌单歌曲" />
    </div>

    <div class="playlist-list">
      <div class="playlist-list-header">
        <div class="playlist-list-item">
          <div></div>
          <div></div>
          <div>音乐标题</div>
          <div>歌手</div>
          <div>专辑</div>
          <div>时长</div>
        </div>
      </div>
      <div class="playlist-list-body">
        <div v-if="data.netErr" class="net-err"
          >网络不给力哦，请检查你的网络设置~</div
        >
        <div
          class="playlist-list-item"
          v-for="(song, index) in data.playlist.tracks"
          :key="song.id"
          @dblclick="handlePlay(index, data.playlist.tracks)"
        >
          <div class="index">{{ index + 1 }}</div>
          <div class="opt">
            <SvgIcon name="heart" class="icon-bootstrap" />
            <SvgIcon name="download" class="icon-bootstrap" />
          </div>
          <div
            class="text-overflow name"
            :title="song.origin_name"
            v-html="song.name"
          />
          <div
            class="text-overflow ar"
            :title="song.ar.map(it => it.origin_name).join('/')"
          >
            <span v-for="ar in song.ar" :key="ar.id" v-html="ar.name" />
          </div>
          <div class="text-overflow al">
            <span v-html="song.al.name" :title="song.al.origin_name" />
          </div>
          <div class="text-overflow dt">{{ formatDuring(song.dt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Image from '@/components/PlaylistImage.vue';
import FCInput from '@/components/Input.vue';
import Avatar from '@/components/Avatar.vue';

import { onBeforeMount, watch, reactive, ref } from 'vue';
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
}

let origin: Track[] = [];

const data = reactive<PlaylistDetail>({
  playlist: {
    tracks: [],
  },
  netErr: false,
});
async function loadPlaylist(params: { id: string }) {
  data.netErr = false;
  try {
    const { playlist } = await getPlaylistDetail(params);
    playlist.tracks.forEach(song => {
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
  } catch (error) {
    data.netErr = true;
  }
}
function resetData() {
  data.playlist = {};
  data.netErr = false;
}

onBeforeMount(() => {
  loadPlaylist({ id: route.params.id as string });
});
watch<string>(
  () => route.params.id as string,
  id => {
    resetData();
    loadPlaylist({ id });
  }
);

// search-start
const searchVal = ref('');
function search() {
  if (!searchVal.value) {
    data.playlist.tracks = origin;
    console.log('re', data, origin);

    return;
  }
  if (origin) {
    const replaceValue = `<span class="s">$1</span>`;
    const searchReg = new RegExp(`(${searchVal.value})`, 'ig');
    const tempTracks = cloneDeep(origin);
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
      return flag;
    });
  }
}

function handlePlay(index: number, list?: Track[]) {
  playerStore.play(index, data.playlist.tracks);
}
const searchThrottle = throttle(search, 500);
watch(searchVal, val => {
  searchThrottle();
});
//  search-end
</script>

<style lang="scss" scoped>
.net-err {
  text-align: center;
  color: #666666;
  height: 30px;
  line-height: 30px;
}

.icon-bootstrap {
  height: 14px;
  width: 14px;
}

.disable {
  color: #d9d9d9;
  border: 1px solid #d9d9d9;
}

.playlist {
  background-color: #fff;

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
        color: #333;
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
        grid-template-columns: auto repeat(2, 130px) auto;
        gap: 10px;

        button {
          font-size: 13px;

          &:not(.options-all) {
            border-radius: 50px;
            border: 1px solid #e1e1e1;
            display: grid;
            grid-template-columns: 14px auto;
            place-items: center;
            padding-left: 10px;

            &:not(.disable):hover {
              background-color: #f3f3f3;
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
        height: 30px;

        span {
          white-space: pre-line;
          color: #666;
          line-height: 30px;
        }
      }
    }
  }

  &-list {
    margin-top: 20px;
    font-size: 12px;

    &-header {
      color: #888888;
    }

    &-body {
      .playlist-list-item {
        &:nth-of-type(odd) {
          background-color: #f8f8f8;
        }

        &:hover {
          background-color: #f2f2f2;
        }
      }
    }

    &-item {
      height: 40px;
      line-height: 40px;
      padding: 0 20px;
      display: grid;
      gap: 15px;
      grid-template-columns: 20px 50px auto repeat(2, 120px) 50px;

      .index {
        color: #bbb;
      }

      .opt {
        height: 100%;
        display: grid;
        grid-template-columns: repeat(2, auto);
        place-items: center;
        gap: 4px;
        color: #bbb;

        .icon-bootstrap {
          width: 14px;
          height: 14px;
        }
      }

      .name {
        color: #000;
      }

      .ar {
        color: #666;

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
        color: #888;

        span {
          cursor: pointer;
        }
      }

      .dt {
        color: #bbb;
      }
    }
  }

  &-opt {
    padding: 0 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
