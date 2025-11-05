<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-show="show" class="f-lyrics-bg">
        <div class="f-lyrics">
          <div class="f-lyrics-header">
            <div>
              <button class="arrow-button" @click="toggleShow">
                <i class="icon-arrow-down iconfont"></i>
              </button>
            </div>
            <div class="f-lyrics-header-title">
              <p class="name">{{ props.song.name || 'unknown' }}</p>
              <p class="arName">{{ props.song.ar || 'unknown' }}</p>
            </div>
          </div>
          <div class="f-lyrics-body">
            <div class="f-lyrics-body-left">
              <ImageComponent
                class="cover"
                :src="props.song.pic + '?param=300y300'"
              />
              <div class="f-lyrics-body-left-options">
                <div class="f-lyrics-body-left-options-slider">
                  <ProgressBar
                    @change="onProgressChange"
                    :progress="props.progress"
                    :duration="props.duration * 1000"
                  />
                </div>
                <div class="f-lyrics-body-left-options-btn">
                  <button
                    @click="previous"
                    class="f-player-control-previous f-player-control-btn"
                  >
                    <i class="icon-play-previous iconfont" />
                  </button>
                  <button
                    @click="togglePlay"
                    class="f-player-control-pau-pla f-player-control-btn"
                  >
                    <i v-if="props.playing" class="iconfont icon-pause" />
                    <i v-else class="iconfont icon-play" />
                  </button>
                  <button
                    @click="next"
                    class="f-player-control-next f-player-control-btn"
                  >
                    <i class="icon-play-next iconfont" />
                  </button>
                </div>
              </div>
            </div>
            <div class="f-lyrics-body-right">
              <!-- <Lyrics
                :is-show="show"
                :lyrics="props.lyrics"
                :progress="props.progress"
              /> -->
              <!-- <LyricsCanvas
                :is-show="show"
                :lyrics="props.lyrics"
                :playing="props.playing"
                :progress="props.progress"
              /> -->
              <LyricPlayer
       
                :is-show="show"
                :lyrics="props.lyrics"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import ImageComponent from '@/components/PlaylistImage.vue';
import ProgressBar from '@/components/player/PlayerProgressBar.vue';
import Lyrics from './Lyrics.vue';
import LyricsCanvas from './LyricsCanvas.vue';
import LyricPlayer from './LyricsRenderer.vue';
import { watch } from 'vue';
import { LyricLine } from '@/utils/parseLyric';
import { fcmAudioPlayer } from '@/utils/audio';
interface Props {
  progress: number;
  duration: number;
  lyrics?: LyricLine[];
  song: {
    id: string | number | null;
    pic: string;
    name: string;
    ar: string;
  };
  playing: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  lyrics: () => [],
  bgColor: () => [245, 245, 245],
});

//#region 控制是否显示歌词
const show = defineModel<boolean>('show', { default: false });
function toggleShow() {
  show.value = !show.value;
}
watch(
  () => show.value,
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
  }
);
//#endregion

//#region 处理媒体控制
interface EmitsType {
  (e: 'previous'): void;
  (e: 'next'): void;
  (e: 'togglePlay'): void;
  (e: 'onProgressChange', val: number): void;
}
const emits = defineEmits<EmitsType>();

function next() {
  emits('next');
}
function previous() {
  emits('previous');
}
function togglePlay() {
  emits('togglePlay');
}

function onProgressChange(val: number) {
  emits('onProgressChange', val);
}
//#endregion
</script>

<style lang="scss">
.f-lyrics-bg {
  position: fixed;
  top: 0;
  height: 100vh;
  width: 100vw;
  z-index: 100;
}
@media (prefers-color-scheme: dark) {
  .f-lyrics {
    &-bg {
      background-image: none !important;
    }
  }
}

.f-lyrics {
  &-bg {
    background-color: var(--bg-color);
    background-image: var(--bg-img);
  }
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  padding: 30px;
  display: grid;
  background-color: var(--lyrics-color);
  gap: 10px;
  grid-template-rows: 100px calc(100% - 110px);
  overflow: hidden;

  &-header {
    display: flex;
    flex-direction: column;
    .arrow-button {
      color: var(--font-color);
    }
    .name,
    .arName {
      text-align: center;
      margin: 5px 0;
    }

    .name {
      font-size: 18px;
      font-weight: bolder;
    }
  }

  &-body {
    display: grid;
    grid-template-columns: 50vh auto;
    height: 100%;
    gap: 60px;
    padding-left: 10vw;

    &-left {
      display: flex;
      flex-direction: column;
      gap: 4vh;
      align-items: center;
      .cover {
        height: 50vh;
        width: 50vh;
        img {
          border-radius: 10px;
        }
      }
      // 进度条、控制按钮

      &-options {
        width: calc(100% + 28px);
        display: grid;
        grid-template-rows: 40px 10vh;
        justify-items: center;
        &-slider {
          // 进度条
          width: 100%;
        }
        &-btn {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
      }
    }

    // 歌词部分
    &-right {
      overflow: hidden;
      width: 100%;
      position: relative;
    }
  }
}
</style>
