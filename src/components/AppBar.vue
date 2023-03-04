<template>
  <div class="app_bar-left drag"> </div>
  <div class="app_bar-right drag">
    <div class="app_bar-right-options">
      <div class="app_bar-right-options-search no-drag">
        <Search />
      </div>
      <div class="app_bar-right-options-buttons no-drag">
        <button @click="clickSetting">
          <i class="bi bi-gear" />
        </button>
      </div>
    </div>
    <div v-if="isWin" class="app_bar-right-button no-drag">
      <WindowButton />
    </div>
  </div>
  <!-- <component :is="appBar" /> -->
</template>

<script lang="ts" setup>
import WindowButton from './WindowButton.vue';
import Search from '@/components/Search.vue';
let isWin = false;
if (process.platform === 'win32') {
  isWin = true;
}

function clickSetting() {
  alert('功能开发中...');
}
</script>
<style lang="scss" scoped>
.app_bar {
  &-left {
    grid-row: 1/2;
    background-color: variables.$appBgColor;
  }
  &-right {
    display: flex;
    justify-content: end;
    grid-row: 1/3;
    &-options {
      display: flex;
      justify-content: flex-end;
      &-search {
        display: flex;
        align-items: center;
      }
      &-buttons {
        margin: 0 20px;
        display: flex;
        height: 30px;
        align-items: center;
        button {
          height: 20px;
          width: 20px;
          font-size: 15px;
          border-radius: 100%;
          &:hover {
            background-color: rgba($color: #000000, $alpha: 0.1);
          }
        }
      }
    }
    &-button {
      width: 140px;
      height: 30px;
    }
  }
}
</style>
