<script setup lang="ts">
import { ref, watch } from 'vue'
interface Props {
  src?: string
}
const props = defineProps<Props>()
const load = ref(false)
function handleLoad() {
  load.value = true
}
watch(() => props.src, () => {
  load.value = false
})
</script>

<template>
  <div class="f-avatar">
    <img v-show="load" :src="props.src" @load="handleLoad">
    <div v-show="!load" class="f-avatar-loading">
      <SvgIcon name="user_90" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.f-avatar {
  height: 100%;
  width: 100%;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  &-loading {
    background-color: #e0e0e0;
    width: 100%;
    height: 100%;
    border-radius: 50px;
    overflow: hidden;

    svg {
      width: 100%;
      height: 80%;
    }
  }
}
</style>