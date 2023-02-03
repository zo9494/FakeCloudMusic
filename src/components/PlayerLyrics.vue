<template>
  <div class="f-lyrics">
    <div class="f-lyrics-header">
      <slot></slot>
    </div>
    <div class="f-lyrics-body">

      <div></div>
      <div class="f-lyrics-body-right scrollbar" ref="scrollRef">
        <p :style="{ height: `${data.viewHeight / 4}px` }"></p>
        <p v-for="item, index in props.lyrics" :key="item.time"
          :class="[data.currentIndex === index ? 'lyric-active' : null, 'lyric']">{{ item.lyric }}
        </p>
        <p :style="{ height: `${data.viewHeight / 4}px` }"></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUpdated, watch, reactive, ref } from 'vue';
interface Props {
  progress: number,
  lyrics: Lyric[]
}
const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  lyrics: () => []
})
const data = reactive({
  currentIndex: 0,
  viewHeight: 500
})


const scrollRef = ref<HTMLDivElement>()
onUpdated(() => {
  if (scrollRef.value?.offsetHeight) {
    data.viewHeight = scrollRef.value.offsetHeight
  }
})

watch(() => props.progress, (val) => {
  if (props.lyrics.length) {
    let currentIndex = 0;
    for (let index = props.lyrics.length - 1; index >= 0; index--) {
      if (val >= props.lyrics[index].time) {
        currentIndex = index;
        break;
      }
    }
    data.currentIndex = currentIndex
  }
})

watch(() => data.currentIndex, handleScroll)

function handleScroll() {
  console.log('scroll');

  const currentEl = document.querySelector('.lyric-active') as HTMLDivElement
  if (scrollRef.value) {
    scrollRef.value.scrollTop = currentEl.offsetTop - scrollRef.value.offsetHeight / 2
  }
}

defineExpose({ handleScroll })

</script>

<style lang="scss">
.f-lyrics {
  padding: 40px 30px 30px 30px;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  display: grid;
  grid-template-rows: 30px calc(100% - 30px);
  overflow: hidden;

  &-body {
    display: grid;
    grid-template-columns: 2fr 3fr;
    height: 100%;

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