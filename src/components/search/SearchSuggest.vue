<template>
  <div class="search-suggest">
    <SearchSuggestList></SearchSuggestList>
  </div>
</template>

<script setup lang="ts">
import SearchSuggestList from '@/components/search/SearchSuggestList.vue';
import { getSearchSuggest } from '@/api/search';
import { onBeforeMount, watch } from 'vue';
// interface PropsType {}
// const props = defineProps<PropsType>();
onBeforeMount(() => {
  getSearchSuggest({ keywords: '会' });
});
</script>

<style scoped lang="scss"></style>
