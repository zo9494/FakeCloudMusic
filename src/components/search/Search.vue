<template>
  <div class="search" ref="searchRef">
    <Popover
      :show="data.visible"
      trigger="manual"
      :on-clickoutside="clickOutSide"
    >
      <template #reference>
        <FInput
          v-model="data.value"
          class="search-input"
          :placeholder="data.placeholder"
          @click.stop="handleClick"
          :on-search="Search"
        />
      </template>
      <div class="search-panel scrollbar-always">
        <SearchSuggest v-show="data.value" :keywords="data.value" />
        <div v-show="!data.value">
          <SearchHistory />
          <HotSearch />
        </div>
      </div>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from '@/hooks/customRouter';
import { onBeforeMount, reactive, onBeforeUnmount, ref } from 'vue';
import FInput from '@/components/Input.vue';
import Popover from '@/components/popover/Popover.vue';
import { getHotSearch } from '@/api/search';
import HotSearch from '@/components/search/HotSearch.vue';
import SearchHistory from '@/components/search/SearchHistory.vue';
import SearchSuggest from '@/components/search/SearchSuggest.vue';
interface DataType {
  value: string;
  placeholder: string;
  timer: number;
  visible: boolean;
}
const router = useRouter();
const data = reactive<DataType>({
  value: '',
  placeholder: '搜索',
  timer: -1,
  visible: false,
});

function autoChangeHotSearch(hot: HotSearch.Hot[], startIndex = 0) {
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

function handleClick() {
  data.visible = true;
}
const searchRef = ref<HTMLDivElement>();
function clickOutSide(e: MouseEvent) {
  // const isSelf = searchRef.value?.contains(e.target as Node);
  // if (!isSelf) {
  //   data.visible = false;
  // }
  data.visible = false;
  console.log(e);
}

function Search() {
  router.push('/search/' + (data.value || data.placeholder));
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
