<template>
  <div class="f-playlist">
    <div class="f-playlist-header">
      <p class="f-playlist-header-title">当前播放</p>
    </div>
    <div class="f-playlist-body">
      <div class="f-playlist-separator"></div>
      <div v-if="props.playlist.length" class="f-playlist-item"></div>
      <div v-else class="f-playlist-empty">
        <p>你还没添加任何歌曲!</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface PropsType {
  playlist?: any[];
}
const props = withDefaults(defineProps<PropsType>(), {
  playlist: () => [],
});
</script>

<style scoped lang="scss">
.f-playlist {
  width: 400px;
  height: calc(100vh - 80px);

  &-header {
    &-title {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }
  }
  &-body {
    height: 100%;
    margin-top: 15px;
    .f-playlist-separator {
      height: 1px;
      width: 100%;
      background-color: #dfdfdf;
    }
    .f-playlist-empty {
      height: 50%;
      display: grid;
      place-items: center;
      color: #888888;
    }
    .f-playlist-item {
    }
  }
}
</style>
