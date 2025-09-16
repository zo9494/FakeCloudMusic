<script lang="ts" setup>
import { useMessage } from 'naive-ui';
import VueSlider from 'vue-slider-component';
import Image from '@/components/PlaylistImage.vue';
import Lyrics from '@/components/player/PlayerLyrics.vue';
import VolumeIcon from '@/components/player/PlayerVolumeIcon.vue';
import List from '@/components/player/Playerlist.vue';
import Popover from '@/components/popover/Popover.vue';
import 'vue-slider-component/theme/default.css';
import { reactive, watch, onMounted } from 'vue';
import { useUserStore } from '@/store/user';

import { formatDuringMS } from '@/utils/time';
import { fcmAudioPlayer } from '@/utils/audio';
import { getImageColor } from '@/utils/utils';
import { useTextScroll } from '@/hooks/textOverflowScroll';
import { Invoke, Listener } from '@/utils/ipcRenderer';
import { getLyric } from '@/api/song';
const userStore = useUserStore();

onMounted(() => {
  useTextScroll('.f-player-info-song-name');
  useTextScroll('.f-player-info-song-ar');
});
interface Data {
  progress: number;
  cacheProgress: number;
  play: boolean;
  currentTime: number;
  volume: number;
  duration: number;
  showLyric: boolean;
  showPlaylist: boolean;
  popoverEl?: HTMLDivElement;
  bgColor: [number, number, number];
  songInfo: {
    id: string | number | null;
    pic: string;
    name: string;
    ar: string;
  };
  lyrics?: Lyric[];
}

const data = reactive<Data>({
  progress: 0,
  cacheProgress: 0,
  play: false,
  volume: 0.5,
  currentTime: 0,
  duration: 0,
  showLyric: false,
  showPlaylist: false,
  bgColor: [245, 245, 245],
  songInfo: {
    id: null,
    pic: '',
    name: '',
    ar: '',
  },
  lyrics: [],
});

watch(
  () => data.volume,
  value => {
    fcmAudioPlayer.volume = value;
  }
);

watch(
  () => data.showLyric,
  val => {
    if (val) {
      document.querySelectorAll('.no-drag-js').forEach(it => {
        it.classList.remove('no-drag-js');
        it.classList.add('drag-js');
      });
    } else {
      document.querySelectorAll('.drag-js').forEach(it => {
        it.classList.remove('drag-js');
        it.classList.add('no-drag-js');
      });
    }
  },
  { immediate: true }
);

function setBgColor(url: string) {
  getImageColor(url + '?param=300y300').then(rgb => {
    document.documentElement.style.cssText = `--bg-img:linear-gradient(0deg,rgb(${rgb.join(
      ','
    )}),rgb(245,245,245))`;
  });
}

// dev
function handleDev() {
  window.alert('功能开发中...');
}

function next() {
  fcmAudioPlayer.next();
}

function previous() {
  fcmAudioPlayer.prev();
}

function togglePlay() {
  if (data.play) {
    fcmAudioPlayer.pause();
  } else {
    fcmAudioPlayer.play();
  }
}

function handlePlay(index: number) {
  fcmAudioPlayer.replacePlaylist(index);
}

function handleProgressChange(value: number) {
  fcmAudioPlayer.currentTime = value;
}

function toggleShowLyric() {
  data.showLyric = !data.showLyric;
}

// like
function updateLike(song: Track | undefined, isDel = false) {
  if (song) {
    userStore.updateLike(song, isDel);
  }
}

function resetPlayerStatus() {
  data.currentTime = 0;
  data.duration = 0;
  data.lyrics = [];
}

fcmAudioPlayer.on('songchange', songInfo => {
  resetPlayerStatus();
  data.songInfo = songInfo;
  setBgColor(songInfo.pic);
  Invoke('SET_TITLE', `${songInfo.name}-${songInfo.ar}`);
  getLyric(songInfo.id).then(lyrics => {
    data.lyrics = lyrics;
  });
});

fcmAudioPlayer.on('play', () => {
  console.log('event:play');

  data.play = true;
  Invoke('WEB:AUDIO_TOGGLE_PLAY', true);
});
fcmAudioPlayer.on('pause', () => {
  data.play = false;
  Invoke('WEB:AUDIO_TOGGLE_PLAY', false);
});
fcmAudioPlayer.on('loadedmetadata', duration => {
  data.duration = duration;
});

fcmAudioPlayer.on('timeupdate', val => {
  if (data.play) {
    data.currentTime = val;
  }
});

Listener('APP:AUDIO_TOGGLE_PLAY', (_, playBool: boolean) => {
  console.log(playBool);
  if (playBool) {
    fcmAudioPlayer.play();
  } else {
    fcmAudioPlayer.pause();
  }
});

Listener('APP:AUDIO_NEXT', next);
Listener('APP:AUDIO_PREVIOUS', previous);
</script>

<template>
  <Transition name="slide-up">
    <div v-show="!data.showLyric" class="f-player">
      <div class="f-player-info">
        <div class="f-player-info-cover" @click="toggleShowLyric">
          <div class="mask">
            <i class="iconfont icon-arrow-up-bold"></i>
          </div>
          <Image class="img" :src="data.songInfo.pic + '?param=300y300'" />
        </div>
        <div class="f-player-info-song">
          <div
            class="f-player-info-song-name"
            v-html="`<span>${data.songInfo.name || ''}</span>`"
          >
          </div>
          <div
            class="f-player-info-song-ar"
            v-html="`<span>${data.songInfo.ar || ''}</span>`"
          >
          </div>
        </div>
      </div>
      <!-- 收藏 -->
      <div class="f-player-heart">
        <span>
          <i
            v-if="userStore.hasLike(data.songInfo.id as number)"
            @click="updateLike(data.songInfo as any, true)"
            class="bi bi-heart-fill"
          />
          <i
            v-else
            class="bi bi-heart"
            @click="updateLike(data.songInfo as any)"
          />
        </span>
      </div>

      <div class="f-player-control">
        <!-- 上一首 -->
        <button
          @click="previous"
          class="f-player-control-previous f-player-control-btn"
        >
          <i class="icon-play-previous iconfont" />
        </button>
        <!-- 暂停、播放 -->
        <button
          class="f-player-control-pau-pla f-player-control-btn"
          @click="togglePlay()"
        >
          <i v-show="data.play" class="iconfont icon-pause" />
          <i v-show="!data.play" class="iconfont icon-play" />
        </button>
        <!-- 下一首 -->
        <button
          @click="next"
          class="f-player-control-next f-player-control-btn"
        >
          <i class="icon-play-next iconfont" />
        </button>
      </div>
      <!-- 播放进度 -->
      <div class="f-player-progress">
        <span>{{ formatDuringMS(data.currentTime) }}</span>
        <div class="f-player-progress-bar">
          <VueSlider
            :modelValue="data.currentTime"
            :lazy="true"
            :height="5"
            @change="handleProgressChange"
            :min="0"
            :max="data.duration || 1"
            :duration="0"
            :interval="0.001"
            tooltip="none"
            :dot-size="10"
          >
            <template v-slot:process="{ _, __, style }">
              <div class="vue-slider-process" :style="style"> </div>
              <div
                class="vue-slider-process-cache"
                :style="{ width: `${data.cacheProgress}%` }"
              ></div>
            </template>
          </VueSlider>
        </div>
        <span>{{ formatDuringMS(data.duration) }}</span>
      </div>

      <div class="f-player-right-control">
        <Popover trigger="click" placement="top-start" display-directive="show">
          <template #reference>
            <button class="f-player-right-control-list">
              <i class="icon-playlist-music iconfont"> </i>
            </button>
          </template>

          <List
            @handle-play="handlePlay"
            :playlist="fcmAudioPlayer.list"
            :current-index="fcmAudioPlayer.currentIndex"
          />
        </Popover>

        <div class="f-player-right-control-volume">
          <VolumeIcon :volume="data.volume"></VolumeIcon>
          <VueSlider
            :duration="0"
            class="f-player-right-control-volume-bar"
            v-model="data.volume"
            :max="1"
            :interval="0.01"
            tooltip="none"
            :height="4"
            :dot-size="10"
          >
          </VueSlider>
        </div>
      </div>
    </div>
  </Transition>

  <Teleport to="body">
    <Transition name="slide-up">
      <Lyrics
        v-if="data.showLyric"
        :song="data.songInfo"
        class="top"
        :progress="data.currentTime"
        :lyrics="data.lyrics"
      >
        <template v-slot:header>
          <button
            class="arrow-button"
            @click="toggleShowLyric"
            style="color: var(--font-color)"
          >
            <i class="icon-arrow-down-bold iconfont"></i>
          </button>
        </template>
        <template v-slot:options>
          <div class="lyrics-options">
            <div class="lyrics-options-slider">
              <span>{{ formatDuringMS(data.currentTime) }}</span>
              <div class="lyrics-options-slider-bar">
                <VueSlider
                  :height="5"
                  :modelValue="data.currentTime"
                  :lazy="true"
                  @change="handleProgressChange"
                  :min="0"
                  :max="data.duration || 1"
                  :interval="0.001"
                  tooltip="none"
                  :duration="0"
                  :dot-size="10"
                >
                  <template v-slot:process="{ _, __, style }">
                    <div class="vue-slider-process" :style="style"> </div>
                    <div
                      class="vue-slider-process-cache"
                      :style="{ width: `${data.cacheProgress}%` }"
                    ></div>
                  </template>
                </VueSlider>
              </div>
              <span>{{ formatDuringMS(data.duration) }}</span>
            </div>
            <div class="lyrics-options-btn">
              <button
                @click="previous"
                class="f-player-control-previous f-player-control-btn"
              >
                <i class="icon-play-previous iconfont" />
              </button>
              <button
                class="f-player-control-pau-pla f-player-control-btn"
                @click="togglePlay()"
              >
                <i v-show="data.play" class="iconfont icon-pause" />
                <i v-show="!data.play" class="iconfont icon-play" />
              </button>
              <button
                @click="next"
                class="f-player-control-next f-player-control-btn"
              >
                <i class="icon-play-next iconfont" />
              </button>
            </div>
          </div>
        </template>
      </Lyrics>
    </Transition>
  </Teleport>
</template>

<style lang="scss">
.bg {
  background-size: cover;
}

.top {
  position: fixed;
  top: 0;
  height: 100vh;
  width: 100vw;
  z-index: 100;
}

.f-player {
  color: var(--font-color);
  padding: 5px 10px;
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: 200px 25px 130px auto 300px;
  // background-color: var(--bg-color);
  // background-image: var(--player-img);
  gap: 10px;
  place-items: center;
  border-radius: 10px;
  border: 1px solid var(--player-border-color);
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  &-info {
    width: 100%;
    display: grid;
    grid-template-columns: 45px auto;
    gap: 5px;

    &-cover {
      position: relative;
      width: 45px;
      height: 45px;
      border-radius: 10px;
      overflow: hidden;

      &:hover {
        .mask {
          display: grid;
        }
      }

      .mask {
        cursor: pointer;
        display: none;
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3);
        color: #fff;
        place-items: center;
      }

      .img,
      img {
        width: 100%;
        height: 100%;
      }
    }

    &-song {
      display: grid;
      grid-template-rows: repeat(2, 1fr);
      align-items: center;
      [class^='f-player-info-song-'] {
        overflow: hidden;
        white-space: nowrap;
      }
      --text-gap: 20px;
      &-name {
        font-weight: bold;
        > * {
          display: inline-block;
        }
      }

      &-ar {
        font-size: 12px;
        color: var(--playlist-item-ar-font-color);
        > * {
          display: inline-block;
        }
      }
    }
  }

  &-heart {
    display: grid;
    place-items: center;

    .heart {
      color: #666666;

      &-fill {
        color: variables.$primaryColor;
      }
    }

    svg {
      width: 15px;
      height: 15px;
    }
  }

  &-control {
    display: grid;
    grid-template-columns: 30px 40px 30px;
    place-items: center;
    height: 100%;
    gap: 5px;

    &-btn {
      // width: 30px;
      // height: 30px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      padding: 5px 8px;

      &:hover {
        background-color: rgba(209, 209, 214, 0.28);
      }

      .iconfont {
        font-size: 24px;
      }
    }
  }

  &-progress {
    width: 100%;
    display: grid;
    grid-template-columns: 40px auto 40px;
    font-size: 12px;
    color: #888888;
    place-items: center;

    &-bar {
      width: 100%;
    }
  }

  &-right-control {
    display: flex;
    gap: 5px;

    &-volume {
      width: 100px;
      display: grid;
      grid-template-columns: 20px auto;
      align-items: center;
      font-size: 20px;
      &-bar {
        width: 100%;
      }
    }

    &-list {
      padding: 0px 13px;
      border-radius: 10px;
      .iconfont {
        font-size: 13px;
      }
      &:hover {
        background-color: rgba(209, 209, 214, 0.28);
      }
    }
  }
}
.vue-slider {
  .vue-slider-process-cache {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background-color: var(--player-cache-track-color);
    border-radius: 15px;
    width: 0%;
  }

  .vue-slider-dot-handle {
    cursor: pointer;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #fff;
    box-shadow: 0.5px 0.5px 2px 1px rgba(0, 0, 0, 0.12);
    visibility: hidden;
  }

  .vue-slider-rail {
    background-color: var(--player-track-color);
  }

  .vue-slider-process {
    background-color: #ec4141;
  }

  &:hover {
    .vue-slider-dot-handle {
      visibility: visible;
    }
  }

  &:active {
    .vue-slider-dot-handle {
      visibility: visible;
    }
  }
}
.arrow-button {
  border-radius: 6px;
  padding: 5px 10px;
  cursor: pointer;
  &:hover {
    background-color: var(--app-bar-button-hover);
  }
}

.icon-arrow-down-bold,
.icon-arrow-up-bold {
  font-size: 23px;
  cursor: pointer;
}

.lyrics-options {
  width: 80%;
  display: grid;
  grid-template-rows: 30px 50px;
  align-items: center;

  &-slider {
    display: flex;
    gap: 5px;
    align-items: center;
    &-bar {
      width: 100%;
    }
  }

  &-btn {
    display: grid;
    grid-template-columns: repeat(3, auto);

    .iconfont {
      font-size: 30px;
    }
  }
}
</style>
