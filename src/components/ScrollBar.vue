<template>
  <div :class="map[props.way]">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
interface propsType {
  way?: 'autoHidden' | 'always';
}
const props = withDefaults(defineProps<propsType>(), {
  way: 'autoHidden',
});
const map = {
  autoHidden: 'scrollbar',
  always: 'scrollbar-always',
};
</script>

<style lang="scss" scoped>
.scrollbar {
  overflow: auto;

  // height: 100%;
  &::-webkit-scrollbar {
    display: none;
    width: 7px;
    height: 7px;
  }

  &:hover {
    &::-webkit-scrollbar {
      display: block;
    }
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: #d1d1d1;
  }

  &-always {
    overflow: auto;

    &::-webkit-scrollbar {
      width: 7px;
      height: 7px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 10px;
      background: #d1d1d1;
    }
  }
}
</style>
