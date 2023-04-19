<template>
  <RouterLink @click="clear" :to="props.to" v-bind="props">
    <slot></slot>
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useHistory } from '@/hooks/customRouter';
const { clear } = useHistory();
const props = defineProps({
  // @ts-ignore
  ...RouterLink.props,
});
</script>
