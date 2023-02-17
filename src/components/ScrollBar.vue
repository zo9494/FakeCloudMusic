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
