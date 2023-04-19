<template>
  <div class="result">
    <p class="result-title">搜索 {{ route.params.keywords }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
</script>

<style scoped lang="scss">
.result {
  padding: 0 10px;
  &-title {
    margin: 0;
    font-size: 16px;
    font-weight: bolder;
  }
}
</style>
