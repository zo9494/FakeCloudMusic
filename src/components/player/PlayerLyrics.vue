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
                    :duration="props.duration"
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
                    <i v-if="props.isPlay" class="iconfont icon-pause" />
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
            <div class="f-lyrics-body-right scrollbar" ref="scrollRef">
              <div class="wrapper">
                <div :style="{ height: `${data.viewHeight / 2}px` }" />
                <div
                  v-for="(item, index) in props.lyrics"
                  :key="item.time"
                  :class="[
                    data.currentIndex === index ? 'item-active' : null,
                    'item',
                  ]"
                >
                  <p class="item-lyric">{{ item.lyric }}</p>
                  <p class="item-tlyric">{{ item.tlyric }}</p>
                </div>
                <div
                  v-if="props.lyrics.length > 1"
                  :style="{ height: `${data.viewHeight / 2}px` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  watch,
  reactive,
  ref,
  onMounted,
  nextTick,
  WatchStopHandle,
} from 'vue';
import ImageComponent from '@/components/PlaylistImage.vue';
import ProgressBar from '@/components/player/PlayerProgressBar.vue';

interface Props {
  progress: number;
  duration: number;
  lyrics?: Lyric[];
  song: {
    id: string | number | null;
    pic: string;
    name: string;
    ar: string;
  };
  isPlay: boolean;
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

//#region 处理歌词、滚动
const data = reactive({
  currentIndex: -1,
  viewHeight: 0,
});
const scrollRef = ref<HTMLDivElement>();

// 只有歌词界面打开时，才处理歌词
let stopProcessLyricHandle: WatchStopHandle | undefined,
  stopAutoScrollHandle: WatchStopHandle | undefined;
watch(
  () => show.value,
  newVal => {
    if (newVal) {
      stopProcessLyricHandle = startProcessLyric();
      stopAutoScrollHandle = startAutoScroll();
      nextTick(() => {
        data.viewHeight = scrollRef.value?.offsetHeight || 0;
      });
    } else {
      stopProcessLyricHandle?.();
      stopAutoScrollHandle?.();
    }
  }
);

function startProcessLyric() {
  return watch(
    () => props.progress,
    val => {
      data.currentIndex = processLyricsIndex(val, props.lyrics);
    },
    { immediate: true }
  );
}

function processLyricsIndex(process: number, lyrics: Lyric[] = []): number {
  if (!process || lyrics.length === 0) {
    console.table(lyrics);
    return -2;
  }
  let index = lyrics.length - 1;
  for (index; index >= 0; index--) {
    if (process >= lyrics[index].time) {
      break;
    }
  }
  return index;
}
function startAutoScroll() {
  return watch(
    () => data.currentIndex,
    () => {
      nextTick(handleScroll);
    },
    { immediate: true }
  );
}

function handleScroll() {
  const el = document.querySelector<HTMLDivElement>('.item-active');
  const elTop = el?.offsetTop || 0;
  const elHeight = el?.offsetHeight || 0;
  const y = elTop - data.viewHeight / 2 + elHeight / 2;
  scrollRef.value?.scrollTo({
    top: y,
    behavior: 'smooth',
  });
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
    grid-template-columns: 2fr 2.4fr;
    height: 100%;
    gap: 60px;

    &-left {
      display: grid;
      grid-template-rows: 240px auto;
      gap: 40px;
      justify-items: center;

      .cover {
        height: 240px;
        width: 240px;

        img {
          border-radius: 10px;
        }
      }
      // 进度条、控制按钮

      &-options {
        width: 80%;
        display: grid;
        grid-template-rows: repeat(2, 1fr);
        &-slider {
          // 进度条
          width: 100%;
        }
        &-btn {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
      }
    }

    // 歌词部分
    &-right {
      width: 100%;
      position: relative;
      .wrapper {
        position: relative;
      }
      .item {
        width: 100%;
        overflow: hidden;
        word-wrap: break-word;
        box-sizing: border-box;
        font-size: 24px;
        color: var(--lyrics-font-color);
        margin: 12px 0;
        transition: all ease-in-out 200ms;
        font-weight: bolder;
        p {
          transition: all ease-in-out 200ms;
          transform-origin: center left;
          margin: 2px 0;
        }
        .item-tlyric {
          font-size: 18px;
          margin: 0;
        }
        &-active {
          transform: translate3d(0, 0, 0);
          color: var(--lyrics-font-active-color);
        }
      }
    }
  }
}
</style>
