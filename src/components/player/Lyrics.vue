<template>
  <div class="lyric">
    <div class="lyric-wrapper scrollbar" ref="scrollViewRef">
      <div :style="{ height: `${data.viewHeight / 2}px` }" />
      <div
        v-for="(item, index) in props.lyrics"
        :key="item.time"
        :class="[data.currentIndex === index ? 'item-active' : null, 'item']"
      >
        <div class="item-lyric">{{ item.lyric }}</div>
        <div class="item-tlyric">{{ item.tlyric }}</div>
      </div>
      <div
        v-if="props.lyrics.length > 1"
        :style="{ height: `${data.viewHeight / 2}px` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  reactive,
  ref,
  nextTick,
  watch,
  WatchStopHandle,
  onMounted,
} from 'vue';

const props = defineProps<{
  lyrics: Lyric[];
  progress: number;
  isShow: boolean;
}>();

const data = reactive<{
  currentIndex: number;
  viewHeight: number;
}>({
  currentIndex: -1,
  viewHeight: 0,
});

const scrollViewRef = ref<HTMLDivElement | null>(null);
onMounted(() => {
  window.addEventListener('resize', setViewHeight);
});
function setViewHeight() {
  nextTick(() => {
    data.viewHeight = scrollViewRef.value?.offsetHeight || 0;
  });
}

// 只有歌词界面打开时，才处理歌词
let stopProcessLyricHandle: WatchStopHandle | undefined,
  stopAutoScrollHandle: WatchStopHandle | undefined;
watch(
  () => props.isShow,
  newVal => {
    if (newVal) {
      stopProcessLyricHandle = startProcessLyric();
      stopAutoScrollHandle = startAutoScroll();
      setViewHeight();
    } else {
      stopProcessLyricHandle?.();
      stopAutoScrollHandle?.();
    }
  },
  { immediate: true }
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
    return -1;
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
  scrollViewRef.value?.scrollTo({
    top: y,
    behavior: 'smooth',
  });
}
</script>

<style lang="scss">
.lyric {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  &-wrapper {
    height: 100%;
    width: 100%;
    overflow-y: auto;
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
    line-height: 1.4;
    div {
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
</style>
