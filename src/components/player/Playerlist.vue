<template>
  <div class="f-playlist">
    <NPopover
      :show-arrow="false"
      trigger="click"
      placement="top-start"
      display-directive="show"
    >
      <template #trigger>
        <button class="f-playlist-control">
          <i class="icon-playlist iconfont"> </i>
        </button>
      </template>

      <div class="f-playlist-wrapper">
        <div class="f-playlist-header">
          <p class="f-playlist-header-title">当前播放</p>
        </div>
        <div class="f-playlist-body">
          <div class="f-playlist-separator"></div>
          <div v-if="props.playlist.length" class="f-playlist-list">
            <RecycleScroller
              class="scrollbar"
              key-field="id"
              :items="props.playlist"
              :item-size="40"
              :min-item-size="40"
            >
              <template v-slot="{ item, index }">
                <div
                  :class="{
                    'playlist-list-item': true,
                    'color-even': item.index % 2,
                    disable: item.noCopyrightRcmd,
                  }"
                  :key="item.id"
                  @dblclick="handlePlay(index)"
                >
                  <div>
                    <i
                      v-if="index === props.currentIndex"
                      class="iconfont icon-play active"
                    ></i>
                  </div>
                  <div class="name">
                    <div
                      class="text-overflow"
                      :title="item.origin_name"
                      v-html="item.name"
                    />
                  </div>

                  <div
                    class="text-overflow ar"
                    :title="item.ar.map((it:Base) => it.origin_name).join('/')"
                  >
                    <span v-for="ar in item.ar" :key="ar.id" v-html="ar.name" />
                  </div>

                  <div class="text-overflow dt">{{
                    formatDuring(item.dt)
                  }}</div>
                </div>
              </template>
            </RecycleScroller>
          </div>
          <div v-else class="f-playlist-empty">
            <p>你还没添加任何歌曲!</p>
          </div>
        </div>
      </div>
    </NPopover>
  </div>
</template>

<script setup lang="ts">
import { formatDuring } from '@/utils/time';
import { RecycleScroller } from 'vue-virtual-scroller';
import { NPopover } from 'naive-ui';
const emit = defineEmits(['handlePlay']);
interface PropsType {
  playlist?: Track[];
  currentIndex?: number | null;
}
const props = withDefaults(defineProps<PropsType>(), {
  playlist: () => [],
});

function handlePlay(index: number) {
  console.log(index);

  emit('handlePlay', index);
}
</script>

<style scoped lang="scss">
.f-playlist {
  display: flex;
  align-items: center;
  .icon-playlist {
    font-size: 20px;
  }

  &-wrapper {
    width: 400px;
    height: 80vh;
    display: flex;
    flex-direction: column;
  }
  &-header {
    padding: 10px;
    &-title {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
      color: var(--font-color);
    }
  }
  &-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    .f-playlist-separator {
      margin: 0 10px 10px;
      height: 1px;
      background-color: #dfdfdf;
    }
    .f-playlist-empty {
      height: 50%;
      display: grid;
      place-items: center;
      color: #888888;
    }
    .f-playlist-list {
      flex: 1;
      padding-left: 10px;
      overflow: hidden;
    }
    .playlist-list-item {
      height: 40px;
      display: grid;
      align-items: center;
      grid-template-columns: 20px auto 100px 50px;
      gap: 10px;
      font-size: 12px;
      > div {
        width: 100%;
        overflow: hidden;
      }
      .name {
        color: var(--playlist-item-name-font-color);
      }
      .ar {
        color: var(--playlist-item-ar-font-color);
      }

      .al {
        color: var(--playlist-item-al-font-color);
      }

      .dt {
        color: var(--playlist-item-dt-font-color);
      }
    }
    .active {
      color: #dd001b;
    }
  }
}
</style>
