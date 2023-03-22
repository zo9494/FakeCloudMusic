<template>
  <i class="icons" v-if="props.volume === 0">&#xe992;</i>
  <i class="icons" v-else-if="props.volume > 0.5">&#xe994;</i>
  <i class="icons" v-else>&#xe993;</i>
</template>

<script setup lang="ts">
interface PropsType {
  // 0--1
  volume: number;
}
const props = defineProps<PropsType>();
</script>
