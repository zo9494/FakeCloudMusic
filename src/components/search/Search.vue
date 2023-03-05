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
      <ScrollBar class="search-panel" way="always">
        <!-- <SearchHistory />
        <HotSearch /> -->
        <SearchSuggest />
      </ScrollBar>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, reactive, onBeforeUnmount } from 'vue';
import FInput from '@/components/Input.vue';
import Popover from '@/components/Popover/Popover.vue';
import { getHotSearch } from '@/api/search';
import ScrollBar from '@/components/ScrollBar.vue';
import HotSearch from '@/components/search/HotSearch.vue';
import SearchHistory from '@/components/search/SearchHistory.vue';
import SearchSuggest from '@/components/search/SearchSuggest.vue';
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

// 历史记录
function recordHistory(value: string) {
  const json = localStorage.getItem('search_history');
  let history: string[];
  if (json) {
    history = JSON.parse(json);
  } else {
    history = [];
  }

  history.push(value);
  localStorage.setItem('search_history', JSON.stringify(json));
}
</script>

<style scoped lang="scss">
.search {
  position: relative;
  &-input {
    height: 24px;
    width: 180px;
  }
  &-panel {
    width: 360px;
    height: 75vh;
    padding-top: 15px;
  }
}
</style>
