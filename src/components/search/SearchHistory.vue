<template>
  <div class="search-history" v-if="data.history.length">
    <div class="search-history-header">
      <span>搜索历史</span>
      <button class="search-history-header-button bi bi-trash3"> </button>
    </div>
    <div class="search-history-body">
      <div class="tag" v-for="item in data.history" key="item">
        <span>{{ item }}</span>
        <button class="tag-suffix bi bi-x-lg"></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, reactive } from 'vue';
interface DataType {
  history: string[];
}

const data = reactive<DataType>({
  history: [],
});

onBeforeMount(() => {
  const history = localStorage.getItem('search_history');
  if (!history) {
    return;
  }
  data.history = JSON.parse(history);
});
</script>

<style lang="scss">
$tagSuffixWidth: 15px;
.search-history {
  padding-left: 15px;
  &-header {
    margin-bottom: 5px;
    font-size: 14px;
    color: #777;
    &-button {
      margin: 0 5px;
      cursor: pointer;
      &:hover {
        color: black;
      }
    }
  }
  &-body {
    .tag {
      margin: 5px;
      display: inline-block;
      font-size: 13px;
      color: #444;
      border: 1px solid #d1d1d1;
      padding: 3px 3px 3px $tagSuffixWidth;
      border-radius: 100px;
      &:hover {
        .tag-suffix {
          opacity: 1;
        }
      }
      &-suffix {
        height: auto;
        width: $tagSuffixWidth;
        opacity: 0;
      }
    }
  }
}
</style>
