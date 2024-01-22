<template>
  <div class="scrollbar">
    <div class="sec">
      <p class="sec-header">
        <span>推荐歌单</span>
        <button>
          <i class="bi bi-chevron-right"></i>
        </button>
      </p>

      <div class="war">
        <div class="item" v-for="item in data.play">
          <div draggable="false" @click="handleClick(`/playlist/${item.id}`)">
            <div class="item-pic">
              <img :src="item.picUrl + '?param=140y140'" alt="" />
            </div>
            <div class="item-desc">
              <p class="item-desc-text" v-text="item.name"></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from '@/hooks/customRouter';
import { reactive } from 'vue';
import { getPersonalized } from '@/api/personalized';

interface DataType {
  play: Personalized.Result[] | undefined;
}
const data = reactive<DataType>({
  play: [],
});
getPersonalized({ limit: 20 }).then(res => {
  console.log(res);
  data.play = res?.result;
});
const router = useRouter();
function handleClick(to: string) {
  router.push(to, true);
}
</script>

<style scoped lang="scss">
$item_width: 160px;
p {
  margin: 0;
}
.sec-header {
  padding: 0 20px 0 0;
  display: flex;
  justify-content: space-between;

  > span {
    font-size: 16px;
    font-weight: bold;
  }
  > button {
    font-size: 18px;
  }
}
.war {
  padding: 10px;
  display: grid;
  justify-content: space-between;
  grid-template-columns: repeat(auto-fill, $item_width);
  gap: 20px;
  padding-bottom: variables.$appBottomSpace;
}
.item {
  width: $item_width;
  height: 200px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--player-border-color);
  overflow: hidden;
  &-pic {
    img {
      height: 140px;
      width: 140px;
      border-radius: 10px;
    }
  }
  .item-desc {
    font-size: 12px;
    &-text {
      margin: 0;
      font-weight: bold;
      display: -webkit-box; /*将对象转为弹性盒模型展示*/
      -webkit-box-orient: vertical; /*设置弹性盒模型子元素的排列方式*/
      -webkit-line-clamp: 2; /*限制文本行数*/
      overflow: hidden; /*超出隐藏*/
    }
  }
}
</style>
