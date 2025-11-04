<template>
  <div class="lyrics">
    <canvas id="lyrics-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { LyricRenderer } from '@/utils/LyricRenderer/LyricRenderer';
import { LyricLine } from '@/utils/parseLyric';
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
}>();

let lyricPlayer: LyricRenderer | null = null;
function initLyricPlayer() {
  const canvas = document.getElementById('lyrics-canvas') as HTMLCanvasElement;
  if (!lyricPlayer) {
    lyricPlayer = new LyricRenderer({
      canvas,
    });
  }
}

onMounted(() => {
  initLyricPlayer();
});

watch(
  () => props.lyrics,
  lyrics => {
    if (lyricPlayer) {
      lyricPlayer.setLyric(lyrics);
    } else {
      initLyricPlayer();
    }
  }
);
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
