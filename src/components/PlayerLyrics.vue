<template>
  <div
    class="f-lyrics-bg"
    :style="{
      backgroundImage: `url(${props.song?.al?.picUrl}?param=512y512)`,
    }"
  >
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
          <Image
            class="cover"
            :src="props.song?.al?.picUrl + '?param=512y512'"
          />
          <slot name="options"></slot>
        </div>
        <div class="f-lyrics-body-right scrollbar" ref="scrollRef">
          <p :style="{ height: `${data.viewHeight / 4}px` }"></p>
          <p
            v-for="(item, index) in props.lyrics"
            :key="item.time"
            :class="[
              data.currentIndex === index ? 'lyric-active' : null,
              'lyric',
            ]"
            >{{ item.lyric }}
          </p>
          <p :style="{ height: `${data.viewHeight / 4}px` }"></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUpdated, watch, reactive, ref } from 'vue';
import Image from '@/components/PlaylistImage.vue';
interface Props {
  progress: number;
  lyrics?: Lyric[];
  song?: Partial<Track>;
}
const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  lyrics: () => [],
});
const data = reactive({
  currentIndex: 0,
  viewHeight: 500,
});

const scrollRef = ref<HTMLDivElement>();
onUpdated(() => {
  if (scrollRef.value?.offsetHeight) {
    data.viewHeight = scrollRef.value.offsetHeight;
  }
});

watch(
  () => props.progress,
  val => {
    if (props.lyrics.length) {
      let currentIndex = 0;
      for (let index = props.lyrics.length - 1; index >= 0; index--) {
        if (val >= props.lyrics[index].time) {
          currentIndex = index;
          break;
        }
      }
      data.currentIndex = currentIndex;
    }
  }
);

watch(() => data.currentIndex, handleScroll);

function handleScroll() {
  console.log('scroll', props);

  const currentEl = document.querySelector('.lyric-active') as HTMLDivElement;
  if (scrollRef.value) {
    scrollRef.value.scrollTop =
      currentEl.offsetTop - scrollRef.value.offsetHeight / 2;
  }
}

defineExpose({ handleScroll });
</script>

<style lang="scss">
.f-lyrics {
  &-bg {
    background-size: cover;
  }
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  padding: 20px 30px 30px 30px;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(30px);
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
      .lyric {
        height: 35px;
        transition: font-size ease-in-out 220ms;

        &-active {
          font-weight: bold;
          font-size: 16px;
        }
      }
    }
  }
}
</style>
