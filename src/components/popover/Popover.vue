<template>
  <NPopover v-bind="props" :show-arrow="false" style="padding: 0">
    <template #trigger>
      <slot name="reference"></slot>
    </template>
    <slot></slot>
  </NPopover>
  <!-- <Trigger @click.stop="onClick" ref="triggerRef">
    <slot v-if="$slots.reference" name="reference"></slot>
  </Trigger> -->

  <!-- <teleport to=".f-popover-container">
    <div :class="popoverClass" v-show="visible" ref="popoverRef">
      <slot></slot>
    </div>
  </teleport> -->
</template>

<script setup lang="ts">
import { NPopover, popoverProps } from 'naive-ui';
const props = defineProps({
  ...popoverProps,
});
// import Trigger from './Trigger';
// import { onMounted, ref, reactive, computed, watch } from 'vue';
// import { createPopper, Instance, Placement } from '@popperjs/core';
// enum trigger {
//   click = 'click',
//   hover = 'hover',
// }
// interface PropsType {
//   trigger?: keyof typeof trigger;
//   popoverClass?: string;
//   visible?: any;
//   placement?: Placement;
// }
// const props = withDefaults(defineProps<PropsType>(), {
//   trigger: 'click',
//   placement: 'auto',
// });

// interface DataType {
//   popperInstance?: Instance;
//   visible: boolean;
// }
// const data = reactive<DataType>({
//   visible: false,
// });
// const isBool = computed(() => typeof props.visible === 'boolean');

// const visible = computed({
//   get() {
//     if (isBool.value) {
//       return props.visible;
//     }
//     return data.visible;
//   },
//   set: updateVisible,
// });

// watch(
//   () => visible.value,
//   val => {
//     data.popperInstance?.update();
//     if (val) {
//       window.addEventListener('click', globalEvent);
//     } else {
//       window.removeEventListener('click', globalEvent);
//     }
//   },
//   { immediate: true }
// );

// let el = document.querySelector('.f-popover-container');
// if (!el) {
//   el = document.createElement('div');
//   el.className = 'f-popover-container';
//   document.body.appendChild(el);
// }

// const popoverClass = computed(() => {
//   if (props.popoverClass) {
//     return `f-popover ${props.popoverClass}`;
//   }
//   return 'f-popover';
// });
// const popoverRef = ref();
// const triggerRef = ref();

// onMounted(() => {
//   data.popperInstance = createPopper(triggerRef.value.$el, popoverRef.value, {
//     placement: props.placement,
//     modifiers: [
//       {
//         name: 'offset',
//         options: {
//           offset: [0, 0],
//         },
//       },
//     ],
//   });
// });

// function onClick() {
//   if (props.trigger === trigger.click) {
//     if (!isBool.value) {
//       visible.value = !visible.value;
//     }
//     // console.log(props.visible);

//     // if (visible.value) {
//     //   window.addEventListener('click', globalEvent);
//     // } else {
//     //   window.removeEventListener('click', globalEvent);
//     // }
//   }
// }

// function globalEvent(e: MouseEvent) {
//   const isSelf = el?.contains(e.target as HTMLElement | null);
//   if (!isSelf) {
//     visible.value = false;
//   }
// }

// // emit
// interface Emits {
//   (e: 'update:visible', payload: any): void;
// }
// const emit = defineEmits<Emits>();
// function updateVisible(val: boolean) {
//   console.log(`update:visible: ${val}; \nisBool: ${isBool.value}`);

//   if (!isBool.value) {
//     data.visible = val;
//   }
//   emit('update:visible', val);
// }
</script>
