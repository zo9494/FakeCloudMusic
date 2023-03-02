<script lang="ts" setup>
import Album150SVG from '@/assets/svg/album_150.svg?component';
import { ref, watch } from 'vue';
interface Props {
  src?: string;
}
const props = defineProps<Props>();
const load = ref(false);
function handleLoad() {
  load.value = true;
}
watch(
  () => props.src,
  () => {
    load.value = false;
  }
);
</script>
<template>
  <div class="playlist-image">
    <img v-show="load" :src="props.src" @load="handleLoad" />
    <div v-show="!load" class="playlist-image-error">
      <Album150SVG />
    </div>
  </div>
</template>

<style lang="scss">
.playlist-image {
  display: inline-block;

  img {
    width: 100%;
    height: 100%;
  }

  &-error {
    background-color: #e0e0e0;
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    padding: 10px;
    border-radius: 10px;

    svg {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
