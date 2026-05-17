<template>
  <div class="lyrics">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { LyricRenderer } from '@/utils/LyricRenderer/LyricRenderer';
import { fcmAudioPlayer } from '@/utils/audio';
import { LyricLine } from '@/utils/parseLyric';
import { ref, watch, onMounted, nextTick } from 'vue';

const props = defineProps<{
  lyrics: LyricLine[];
  isShow: boolean;
}>();

let lyricPlayer: LyricRenderer | null = null;
const canvasRef = ref<HTMLCanvasElement>();
function initLyricPlayer() {
  if (!lyricPlayer && canvasRef.value) {
    const canvas = canvasRef.value;
    lyricPlayer = new LyricRenderer({
      canvas,
    });
    lyricPlayer.setLyric(props.lyrics);
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

watch(
  () => props.isShow,
  isShow => {
    if (isShow) {
      nextTick(() => {
        lyricPlayer?.onResize();
        if (fcmAudioPlayer.playing) {
          animation();
        }
      });
    }
  },
  {
    immediate: true,
  }
);

// request animation frame
let animationFrameId: number | null = null;
function animation() {
  if (lyricPlayer) {
    animationFrameId = requestAnimationFrame(() => {
      lyricPlayer?.setCurrentTime(fcmAudioPlayer.currentTime * 1000);
      animation();
    });
  }
}

fcmAudioPlayer.on('play', () => {
  if (props.isShow) {
    animation();
  }
});
fcmAudioPlayer.on('pause', () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
});
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
