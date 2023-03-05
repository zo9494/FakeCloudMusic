<template>
  <div class="search-suggest">
    <SearchSuggestList :data="data.res"></SearchSuggestList>
    <SearchSuggestList
      v-for="item in data.order"
      :key="item"
      :type="item"
      :data="data[item]"
    ></SearchSuggestList>
  </div>
</template>

<script setup lang="ts">
import SearchSuggestList from '@/components/search/SearchSuggestList.vue';
import { getSearchSuggest, getSearch } from '@/api/search';
import { onBeforeMount, watch, reactive } from 'vue';
import { debounce } from 'lodash';

interface PropsType {
  keywords?: string;
}
const props = defineProps<PropsType>();
type DataType = Partial<HotSearchSuggest.Result> & {
  res?: Search.Song[];
  [propName: string]: any;
};
const data = reactive<DataType>({});
function search(keywords: string) {
  getSearch({ keywords, limit: 16, type: 1 }).then(res => {
    data.res = uniqueFunc(res?.songs);
  });
  getSearchSuggest({ keywords }).then(res => {
    Object.assign(data, res);
  });
}
const searchDebounce = debounce(search, 300);
watch(
  () => props.keywords,
  keywords => {
    if (keywords) {
      searchDebounce(keywords);
    }
  }
);

function uniqueFunc(songs?: Search.Song[]) {
  if (!songs || !songs.length) {
    return;
  }
  const res: { [propName: string]: boolean } = {};
  return songs.filter(item => {
    if (!res[item.name]) {
      res[item.name] = true;
      return true;
    }
    return false;
  });
}
</script>

<style scoped lang="scss"></style>
