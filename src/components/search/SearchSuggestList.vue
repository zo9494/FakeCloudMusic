<template>
  <div class="search-suggest-list">
    <div class="search-suggest-list-header">
      <slot name="header">
        <i class="bi bi-search"></i>
        <span>猜你想搜</span>
      </slot>
    </div>
    <div class="search-suggest-list-body">
      <slot name="item">
        <div class="search-suggest-list-body-item">
          <span>111</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss">
.search-suggest-list {
  font-size: 14px;
  color: #888;
  .bi {
    margin: 0 5px;
  }
  &-header {
    padding-left: 10px;
  }
  &-body {
    margin-top: 10px;
    &-item {
      height: 35px;
      line-height: 35px;
      padding-left: 20px;
      overflow: hidden;
      &:hover {
        background-color: #f2f2f2;
      }
    }
  }
}
</style>
