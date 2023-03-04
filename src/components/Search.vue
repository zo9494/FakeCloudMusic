<template>
  <div class="search">
    <Popover>
      <template #reference>
        <FInput
          v-model="data.value"
          class="search-input"
          :placeholder="data.placeholder"
        />
      </template>
      <div class="search-result">
        <div>11</div>
        <div>11</div>
        <div>11</div>
        <div>11</div>
        <div>11</div>
        <div>11</div>
        <div>11</div>
        <div>11</div>
        <div>11</div>
      </div>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, reactive, onBeforeUnmount } from 'vue';
import FInput from '@/components/Input.vue';
import Popover from '@/components/Popover/Popover.vue';
import { getHotSearch } from '@/api/search';

interface DataType {
  value: string;
  placeholder: string;
  timer: number;
}

const data = reactive<DataType>({
  value: '',
  placeholder: '搜索',
  timer: -1,
});

function autoChangeHotSearch(hot: Hot[], startIndex = 0) {
  window.clearTimeout(data.timer);
  data.placeholder = hot[startIndex].first;
  data.timer = window.setTimeout(() => {
    autoChangeHotSearch(hot, startIndex + 1);
  }, 1000 * 30);
}

onBeforeMount(() => {
  getHotSearch().then(hots => {
    if (hots) {
      autoChangeHotSearch(hots);
    }
  });
});

onBeforeUnmount(() => {
  window.clearTimeout(data.timer);
});
</script>

<style scoped lang="scss">
.search {
  position: relative;
  &-input {
    height: 24px;
    width: 180px;
  }
  &-result {
    width: 320px;
    height: calc(100vh - 100px);
  }
}
</style>
