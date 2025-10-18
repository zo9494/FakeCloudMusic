<template>
  <div class="lyrics">
    <canvas id="lyrics-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { WebGLLyricRenderer } from '@/utils/lyricsCanvas';
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

let webglLyricsRenderer: WebGLLyricRenderer | null = null;
function initLyricsRenderer() {
  if (webglLyricsRenderer) {
    if (!webglLyricsRenderer.getLyric().length) {
      webglLyricsRenderer.setLyric(props.lyrics);
    } else {
      webglLyricsRenderer.resize();
    }
    return;
  }
  const canvas = document.getElementById('lyrics-canvas') as HTMLCanvasElement;
  webglLyricsRenderer = new WebGLLyricRenderer(canvas);
  webglLyricsRenderer.setLyric(props.lyrics);
}
// 只有歌词界面打开时，才处理歌词
let stopProcessLyricHandle: WatchStopHandle | undefined;
watch(
  () => props.isShow,
  newVal => {
    if (newVal) {
      nextTick(initLyricsRenderer);
      stopProcessLyricHandle = startProcessLyric();
    } else {
      stopProcessLyricHandle?.();
    }
  },
  { immediate: true }
);

watch(
  () => props.lyrics,
  newVal => {
    webglLyricsRenderer?.setLyric(newVal);
  },
  { immediate: true }
);
function startProcessLyric() {
  return watch(
    () => props.progress,
    val => {
      webglLyricsRenderer?.setCurrentTime(val);
    },
    { immediate: true }
  );
}
</script>

<style lang="scss">
.lyrics {
  height: 100%;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  #lyrics-canvas {
    width: 100%;
    height: 100%;
  }
}
</style>
