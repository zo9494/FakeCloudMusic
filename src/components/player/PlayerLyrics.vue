<template>
  <div
    class="f-lyrics-bg"
    :style="{
      backgroundImage: `linear-gradient(0deg,rgb(${props.bgColor.join(
        ','
      )}),rgb(245,245,245))`,
    }"
  >
    <div class="app_bar-blank"></div>
    <div class="f-lyrics">
      <div class="f-lyrics-header">
        <div>
          <slot name="header"></slot>
        </div>
        <div class="f-lyrics-header-title">
          <p class="name">{{ props.song?.name || 'unknown' }}</p>
          <p class="arName">{{ props.song?.arName || 'unknown' }}</p>
        </div>
      </div>
      <div class="f-lyrics-body">
        <div class="f-lyrics-body-left">
          <ImageComponent
            class="cover"
            :src="props.song?.al?.picUrl + '?param=300y300'"
          />
          <slot name="options"></slot>
        </div>
        <div class="f-lyrics-body-right scrollbar" ref="scrollRef">
          <p :style="{ height: `${data.viewHeight / 4}px` }"></p>
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
          <p :style="{ height: `${data.viewHeight / 4}px` }"></p>
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
  song?: Partial<Track>;
  bgColor?: [number, number, number];
}
const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  lyrics: () => [],
  bgColor: () => [245, 245, 245],
});
const data = reactive({
  currentIndex: -1,
  viewHeight: 400,
});

const scrollRef = ref<HTMLDivElement>();

onMounted(() => {
  data.currentIndex = processLyricsIndex(props.progress, props.lyrics);
  nextTick(() => {
    if (scrollRef.value?.offsetHeight) {
      data.viewHeight = scrollRef.value.offsetHeight;
    }
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

watch(() => data.currentIndex, handleScroll);

function handleScroll() {
  if (scrollRef.value) {
    if (data.currentIndex === -1) {
      scrollRef.value.scrollTop = 0;
      return;
    }
    try {
      const currentEl = document.querySelector(
        '.item-active'
      ) as HTMLDivElement;
      scrollRef.value.scrollTop =
        currentEl.offsetTop - scrollRef.value.offsetHeight / 1.4;
    } catch {}
  }
}

defineExpose({ handleScroll });
</script>

<style lang="scss">
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
    // background-color: whitesmoke;
    // background-size: cover;
    position: relative;
  }
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  padding: 40px 30px 30px;
  background-color: rgba(255, 255, 255, 0.6);
  display: grid;
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
      .item {
        font-size: 14.8px;
        color: #555;
        margin: 15px 0;
        transition: all ease-in-out 220ms;
        p {
          margin: 5px 0;
        }
        &-active {
          font-weight: bold;
          color: #000;
        }
      }
    }
  }
}
</style>