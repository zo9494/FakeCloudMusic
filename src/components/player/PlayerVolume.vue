<template>
  <div class="volume">
    <VolumeIcon @click="handleClick" class="volume-icon" :volume="volume" />
    <VueSlider
      v-model="volume"
      class="volume-bar"
      :duration="0"
      :max="1"
      :interval="0.01"
      tooltip="none"
      :height="4"
      :dot-size="12"
    />
  </div>
</template>

<script lang="ts" setup>
import VolumeIcon from '@/components/player/PlayerVolumeIcon.vue';
import VueSlider from 'vue-slider-component';
const volume = defineModel<number>('volume', { required: true });
function handleClick() {
  if (volume.value === 0) {
    volume.value = 0.5;
  } else {
    volume.value = 0;
  }
}
</script>

<style lang="scss" scoped>
.volume {
  display: grid;
  grid-template-columns: 20px 1fr;
  align-items: center;
  &-icon {
    font-size: 22px;
  }
  &-bar {
    width: 100%;
  }
}
</style>
