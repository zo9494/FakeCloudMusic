<script lang="ts" setup>
import { ref } from 'vue'
interface Props {
  src?: string
}
const props = defineProps<Props>()
const load = ref(false)
function handleLoad() {
  load.value = true
}
</script>
<template>
  <div class="playlist-image">
    <img v-show="load" :src="props.src" @load="handleLoad">
    <div v-show="!load" class="playlist-image-error">
      <SvgIcon name="album_150" />
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

    svg {
      width: 150px;
      height: 150px;
    }
  }
}
</style>