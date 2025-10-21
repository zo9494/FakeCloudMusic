<template>
  <div class="progress-bar">
    <span>{{ formatMillisecondsToMMSS(props.progress) }}</span>
    <div class="progress-bar-slider">
      <VueSlider
        :modelValue="props.progress"
        @change="onChange"
        :lazy="true"
        :height="5"
        :min="0"
        :max="props.duration * 1000 || 1"
        :duration="0"
        :interval="0.001"
        tooltip="none"
        :dot-size="12"
      >
      </VueSlider>
    </div>
    <span>{{ formatSecondsToMMSS(props.duration) }}</span>
  </div>
</template>

<script setup lang="ts">
import VueSlider from 'vue-slider-component';
import { formatMillisecondsToMMSS, formatSecondsToMMSS } from '@/utils/time';
interface PropsType {
  // 毫秒
  progress: number;
  // 毫秒
  duration: number;
}
interface EmitsType {
  (e: 'change', val: number): void;
}
const emits = defineEmits<EmitsType>();

const props = defineProps<PropsType>();

function onChange(val: number) {
  emits('change', val);
}
</script>

<style lang="scss" scoped>
.progress-bar {
  display: grid;
  grid-template-columns: 40px auto 40px;
  justify-items: center;
  align-items: center;
  gap: 2px;
  &-slider {
    width: 100%;
  }
}
</style>
