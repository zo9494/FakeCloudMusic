<template>
  <div class="no-source-tag">
    <span class="tag">无音源</span>
    <span v-text="desc"></span>
  </div>
</template>

<script lang="ts" setup>
const { desc } = defineProps<{ desc?: string }>();
</script>
<style lang="scss" scoped>
$height: 18px;
.tag {
  font-size: 10px;
  display: inline-block;
  border: 1px solid #5f5f5f;
  height: $height;
  line-height: $height;
  padding: 0 5px;
  color: #5f5f5f;
  border-radius: 4px;
}
</style>
