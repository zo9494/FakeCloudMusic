<template>
  <header class="app-bar drag">
    <div class="app-bar-options">
      <div class="app-bar-options-search no-drag">
        <Search />
      </div>
      <div class="app-bar-options-buttons no-drag">
        <button @click="clickSetting">
          <i class="bi bi-palette"></i>
        </button>
        <button @click="clickSetting">
          <i class="bi bi-gear" />
        </button>
      </div>
    </div>
    <div v-if="isWin" class="app-bar-button no-drag">
      <WindowButton />
    </div>
  </header>
  <!-- <component :is="appBar" /> -->
</template>

<script lang="ts" setup>
import WindowButton from './WindowButton.vue';
import Search from '@/components/search/Search.vue';
let isWin = false;
if (process.platform === 'win32') {
  isWin = true;
}

function clickSetting() {
  alert('功能开发中...');
}
</script>
<style lang="scss" scoped>
.app-bar {
  left: 0px;
  right: 0px;
  top: 0px;
  z-index: 999;
  position: absolute;
  display: flex;
  justify-content: end;
  &-options {
    display: flex;
    justify-content: flex-end;
    &-search {
      padding-top: 5px;
      display: flex;
      align-items: center;
    }
    &-buttons {
      margin: 0 20px;
      display: flex;
      height: 30px;
      align-items: center;
      gap: 15px;
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
// .app_bar {
//   &-left {
//     grid-row: 1/2;
//     background-color: variables.$appBgColor;
//   }
//   &-right {
//     display: flex;
//     justify-content: end;
//     grid-row: 1/3;
//   }
// }
</style>
