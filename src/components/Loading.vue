<template>
  <div class="f-loading">
    <LoadingSvg></LoadingSvg>
  </div>
</template>

<script setup lang="ts">
import LoadingSvg from '@/assets/svg/tail-spin.svg?component';
</script>

<style lang="scss">
.f-loading {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: red;
}
</style>
