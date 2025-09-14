<template>
  <div class="f-lyrics-bg">
    <div class="f-lyrics">
      <div class="f-lyrics-header">
        <div>
          <slot name="header"></slot>
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
          <slot name="options"></slot>
        </div>
        <div class="f-lyrics-body-right scrollbar" ref="scrollRef">
          <div class="wrapper">
            <div :style="{ height: `${data.viewHeight / 2}px` }"></div>
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
            <div :style="{ height: `${data.viewHeight / 2}px` }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, reactive, ref, onMounted, nextTick } from 'vue';
import ImageComponent from '@/components/PlaylistImage.vue';
interface Props {
  progress: number;
  lyrics?: Lyric[];
  song: {
    id: string | number | null;
    pic: string;
    name: string;
    ar: string;
  };
}
const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  lyrics: () => [],
  bgColor: () => [245, 245, 245],
});
const data = reactive({
  currentIndex: -1,
  viewHeight: 0,
});

const scrollRef = ref<HTMLDivElement>();

onMounted(() => {
  data.viewHeight = scrollRef.value?.offsetHeight || 0;
  data.currentIndex = processLyricsIndex(props.progress, props.lyrics);
  nextTick(() => {
    handleScroll();
  });
});

watch(
  () => props.progress,
  val => {
    data.currentIndex = processLyricsIndex(val, props.lyrics);
  }
);

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

watch(
  () => data.currentIndex,
  () => {
    nextTick(handleScroll);
  }
);

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

defineExpose({ handleScroll });
</script>

<style lang="scss">
@media (prefers-color-scheme: dark) {
  .f-lyrics {
    &-bg {
      background-image: none !important;
    }
  }
}
#bg {
  position: absolute;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}

.f-lyrics {
  &-bg {
    background-color: var(--bg-color);
    background-image: var(--bg-img);
    position: relative;
  }
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  padding: 40px 30px 30px;
  display: grid;
  background-color: var(--lyrics-color);
  gap: 10px;
  grid-template-rows: 100px calc(100% - 110px);
  overflow: hidden;

  &-header {
    display: flex;
    flex-direction: column;

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
    grid-template-columns: 2fr 2.1fr;
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
    }

    &-right {
      width: 98%;
      position: relative;
      .wrapper {
        position: relative;
      }
      .item {
        box-sizing: border-box;
        width: 100%;
        font-size: 24px;
        color: var(--lyrics-font-color);
        margin: 12px 0;
        transition: all ease-in-out 200ms;
        p {
          width: 90%;
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
          font-weight: bold;
          color: var(--lyrics-font-active-color);
        }
      }
    }
  }
}
</style>
