<template>
  <div class="progress-bar">
    <span>{{ formatMillisecondsToMMSS(progress) }}</span>
    <div class="progress-bar-slider">
      <VueSlider
        :modelValue="progress"
        @change="onChange"
        :lazy="true"
        :height="5"
        :min="0"
        :duration="0"
        :max="duration"
        :interval="1"
        tooltip="none"
        :dot-size="12"
      >
      </VueSlider>
    </div>
    <span>{{ formatMillisecondsToMMSS(duration) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
const progress = computed(() => props.progress | 0);
const duration = computed(() => props.duration | 0);
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
