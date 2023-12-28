<template>
  <i class="icon-fluent icon-fluent-volume-mute" v-if="props.volume === 0"></i>
  <i
    class="icon-fluent icon-fluent-volume-full"
    v-else-if="props.volume > 0.5"
  ></i>
  <i class="icon-fluent icon-fluent-volume-half" v-else></i>
</template>

<script setup lang="ts">
interface PropsType {
  // 0--1
  volume: number;
}
const props = defineProps<PropsType>();
</script>
