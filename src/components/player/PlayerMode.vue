<template>
  <button @click="togglePlayMode">
    <i class="iconfont" :class="mode.c" :title="mode.tip"></i>
  </button>
</template>

<script setup lang="ts">
import { PlayMode } from '@/utils/audio';
import { computed } from 'vue';
const playMode = defineModel<number>('playMode', { default: 0 });

interface EmitsType {
  (e: 'onChange', mode: number): void;
}
const emits = defineEmits<EmitsType>();
const maps = [
  {
    c: 'icon-order',
    tip: '顺序播放',
  },
  {
    c: 'icon-loop',
    tip: '循环播放',
  },
  {
    c: 'icon-repeat',
    tip: '单曲循环',
  },
  {
    c: 'icon-shuffle',
    tip: '随机播放',
  },
];
const mode = computed(() => maps[playMode.value]);

function togglePlayMode() {
  let val = playMode.value + 1;
  if (val > PlayMode.shuffle) {
    val = PlayMode.order;
  }
  playMode.value = val;
  emits('onChange', val);
}
</script>

<style lang="scss" scoped>
.icon-order {
  font-size: 16px;
}
</style>
