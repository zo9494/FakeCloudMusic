<script lang="ts" setup>
import Image from '@/components/PlaylistImage.vue';
import PlayerLyrics from '@/components/player/PlayerLyrics.vue';
import PlayerList from '@/components/player/Playerlist.vue';
import Volume from '@/components/player/PlayerVolume.vue';
import ProgressBar from '@/components/player/PlayerProgressBar.vue';
import PlayerMode from '@/components/player/PlayerMode.vue';
import 'vue-slider-component/theme/default.css';
import { reactive, watch, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { fcmAudioPlayer } from '@/utils/audio';
import { getImageColor } from '@/utils/utils';
import { useTextScroll } from '@/hooks/textOverflowScroll';
import { Invoke, Listener } from '@/utils/ipcRenderer';
import { getLyric } from '@/api/song';
import { user } from '@/utils/database';
import { lyricsBackground } from '@/utils/background';
const userStore = useUserStore();

onMounted(() => {
  useTextScroll('.f-player-info-song-name');
  useTextScroll('.f-player-info-song-ar');
});
interface Data {
  play: boolean;
  currentTime: number;
  volume: number;
  duration: number;
  showLyric: boolean;
  showPlaylist: boolean;
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

// function setBgColor(url: string) {
//   getImageColor(url + '?param=300y300').then(rgb => {
//     document.documentElement.style.cssText = `--bg-img:linear-gradient(0deg,rgb(${rgb.join(
//       ','
//     )}),rgb(245,245,245))`;
//   });
// }

// dev
function handleDev() {
  window.alert('功能开发中...');
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
function onPlayModeChange(mode: number) {
  fcmAudioPlayer.togglePlayMode(mode);
}

function handlePlay(index: number) {
  fcmAudioPlayer.replacePlaylist(index);
}

function handleProgressChange(value: number) {
  data.currentTime = value;
  fcmAudioPlayer.currentTime = value;
}

fcmAudioPlayer.on('songchange', songInfo => {
  resetPlayerStatus();
  data.songInfo = songInfo || {};
  // setBgColor(songInfo?.pic || '');
  lyricsBackground.setAlImage(songInfo.pic, false);
  Invoke('SET_TITLE', songInfo ? `${songInfo.name}-${songInfo.ar}` : '');
  if (songInfo) {
    getLyric(songInfo.id).then(lyrics => {
      data.lyrics = lyrics;
    });
  } else {
    data.lyrics = [];
  }
});

fcmAudioPlayer.on('play', () => {
  console.log('event:play');
  lyricsBackground.resume();
  data.play = true;
  Invoke('WEB:AUDIO_TOGGLE_PLAY', true);
});
fcmAudioPlayer.on('pause', () => {
  data.play = false;
  lyricsBackground.pause();
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
            <i class="iconfont icon-arrow-up"></i>
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
        <ProgressBar
          :progress="data.currentTime"
          :duration="data.duration"
          @change="handleProgressChange"
        />
      </div>

      <div class="f-player-right-control">
        <PlayerMode @on-change="onPlayModeChange" />
        <PlayerList
          @handle-play="handlePlay"
          :current-song-id="data.songInfo.id"
          :playlist="fcmAudioPlayer.list"
        />
        <div class="f-player-right-control-volume">
          <Volume v-model:volume="data.volume"></Volume>
        </div>
      </div>
    </div>
  </Transition>

  <PlayerLyrics
    v-model:show="data.showLyric"
    :is-play="data.play"
    @next="next"
    @previous="previous"
    @toggle-play="togglePlay"
    @on-progress-change="handleProgressChange"
    :song="data.songInfo"
    :progress="data.currentTime"
    :duration="data.duration"
    :lyrics="data.lyrics"
  >
  </PlayerLyrics>
</template>

<style lang="scss">
.bg {
  background-size: cover;
}

.f-player {
  color: var(--font-color);
  padding: 5px 10px;
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: 200px 25px 130px auto 200px;
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
  }

  // 右边音量、播放模式、播放列表 部分
  &-right-control {
    display: grid;
    grid-template-columns: 20px 20px auto;
    gap: 10px;
    &-volume {
      width: 100px;
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

// .icon-arrow-down-bold,
// .icon-arrow-up-bold {
//   font-size: 23px;
//   cursor: pointer;
// }
</style>
