<template>
  <div class="hot-search">
    <div class="hot-search-header">
      <span>热搜榜</span>
    </div>
    <div class="hot-search-body">
      <div class="list">
        <div
          class="list-item"
          @click="handleClick"
          v-for="(item, index) in data.hotSearch"
        >
          <div class="list-item-index">{{ index + 1 }}</div>
          <div class="list-item-body">
            <p>{{ item.searchWord }}</p>
            <p>{{ item.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, reactive, inject } from 'vue';
import { getHotSearchDetail } from '@/api/search';
import type { SearchInjection } from '@/components/search/Search.vue';
const Search = inject('SearchInjection') as SearchInjection;
interface DataType {
  hotSearch: HotDetail.Datum[];
}

const data = reactive<DataType>({
  hotSearch: [],
});
onBeforeMount(() => {
  getHotSearchDetail().then(det => {
    if (det) {
      data.hotSearch = det;
    }
  });
});

function handleClick() {
  console.log('handleClick');
  Search.popoverClose();
}
</script>

<style lang="scss">
.hot-search {
  margin: 10px 0;
  &-header {
    font-size: 14px;
    color: var(--menu-title-color);
    margin: 5px 0;
    padding-left: 15px;
  }
  &-body {
    .list {
      &-item {
        padding-left: 15px;
        font-size: 12px;
        color: var(--font-color);
        display: grid;
        grid-template-columns: 30px auto;
        grid-template-rows: 50px;
        align-items: center;
        &:hover {
          background-color: var(--menu-hover-bg-color);
        }
        &-index {
          font-size: 14px;
          color: #999;
        }
        &-body {
          p {
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          p:nth-of-type(2) {
            margin: 2px 0;
            color: #888;
          }
        }

        @for $i from 1 through 3 {
          &:nth-of-type(#{$i}) {
            .list-item-index {
              color: #ec4141;
            }
          }
        }
      }
    }
  }
}
</style>
