<template>
  <div class="lyrics">
    <canvas id="lyrics-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import 'pixi.js/unsafe-eval';
import { LyricRenderer } from '@/utils/LyricRenderer';
// import { WebGLLyricRenderer } from '@/utils/lyricsCanvas';
import { LyricLine } from '@/utils/parseLyric';
import { fcmAudioPlayer } from '@/utils/audio';
import {
  reactive,
  ref,
  nextTick,
  watch,
  WatchStopHandle,
  onMounted,
} from 'vue';

const props = defineProps<{
  lyrics: LyricLine[];
  progress: number;
  isShow: boolean;
  playing: boolean;
}>();

let lyricRenderer: LyricRenderer | null = null;
function initLyricsRenderer() {
  if (lyricRenderer) {
    if (!lyricRenderer.getLyric().length) {
      lyricRenderer.setLyric(props.lyrics);
    }
    lyricRenderer.setCurrentTime(fcmAudioPlayer.currentTime * 1000);
    return;
  }
  const canvas = document.getElementById('lyrics-canvas') as HTMLCanvasElement;

  // 设置canvas初始尺寸
  if (canvas.parentElement) {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }

  lyricRenderer = new LyricRenderer({
    canvas,
  });
  lyricRenderer.setLyric(props.lyrics);
}

// 更新
const h = {
  animationId: 0,
  update() {
    lyricRenderer?.setCurrentTime(fcmAudioPlayer.currentTime * 1000);
    this.animationId = requestAnimationFrame(() => {
      this.update.call(h);
    });
  },
  cancel() {
    cancelAnimationFrame(this.animationId);
  },
};

function processUpdate() {
  if (props.isShow) {
    if (props.isShow) {
      nextTick(initLyricsRenderer);
    }
  }

  if (props.playing && props.isShow) {
    h.update();
  } else {
    h.cancel();
  }
}

fcmAudioPlayer.on('seeked', () => {
  lyricRenderer?.setCurrentTime(fcmAudioPlayer.currentTime * 1000);
});

watch(
  () => props.isShow,
  () => {
    processUpdate();
  },
  { immediate: true }
);

watch(
  () => props.playing,
  () => {
    processUpdate();
  }
);

watch(
  () => props.lyrics,
  newVal => {
    lyricRenderer?.setLyric(newVal);
  },
  { immediate: true }
);
</script>

<style lang="scss">
.lyrics {
  height: 100%;
  width: 100%;
  position: relative;
  #lyrics-canvas {
    width: 100%;
    height: 100%;
    display: block; // 添加显示属性以避免默认的inline行为
  }
}
</style>
