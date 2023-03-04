<template>
  <Trigger @click="onClick" ref="triggerRef">
    <slot v-if="$slots.reference" name="reference"></slot>
  </Trigger>

  <teleport to=".f-popover-container">
    <div :class="popoverClass" v-show="visible" ref="popoverRef">
      <slot></slot>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import Trigger from './Trigger';
import { onMounted, ref, reactive, computed, watch } from 'vue';
import { createPopper, Instance } from '@popperjs/core';
enum trigger {
  click = 'click',
  hover = 'hover',
}
interface PropsType {
  trigger?: keyof typeof trigger;
  popoverClass?: string;
  visible?: any;
}
const props = withDefaults(defineProps<PropsType>(), {
  trigger: 'click',
});

interface DataType {
  popperInstance?: Instance;
  visible: boolean;
}
const data = reactive<DataType>({
  visible: false,
});
const isBool = computed(() => typeof props.visible === 'boolean');

const visible = computed({
  get() {
    if (isBool.value) {
      return props.visible;
    }
    return data.visible;
  },
  set: updateVisible,
});

watch(
  () => visible.value,
  () => {
    data.popperInstance?.update();
  },
  { immediate: true }
);

let el = document.querySelector('.f-popover-container');
if (!el) {
  el = document.createElement('div');
  el.className = 'f-popover-container';
  document.body.appendChild(el);
}

const popoverClass = computed(() => {
  if (props.popoverClass) {
    return `f-popover ${props.popoverClass}`;
  }
  return 'f-popover';
});
const popoverRef = ref();
const triggerRef = ref();

onMounted(() => {
  data.popperInstance = createPopper(triggerRef.value.$el, popoverRef.value, {
    placement: 'top',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 0],
        },
      },
    ],
  });
});

function onClick() {
  if (props.trigger === trigger.click) {
    updateVisible(!visible.value);
    if (visible.value) {
      window.addEventListener('click', globalEvent, { capture: true });
    } else {
      window.removeEventListener('click', globalEvent, { capture: true });
    }
  }
}

function globalEvent(e: MouseEvent) {
  const isSelf = el?.contains(e.target as HTMLElement | null);
  if (!isSelf) {
    updateVisible(false);
  }
}

// emit
interface Emits {
  (e: 'update:visible', payload: any): void;
}
const emit = defineEmits<Emits>();
function updateVisible(val: boolean) {
  console.log('updateVisible: ' + val);
  console.log('isBool: ' + isBool.value);

  if (!isBool.value) {
    data.visible = val;
  }
  emit('update:visible', val);
}
</script>

<style lang="scss">
.f-popover {
  background-color: #fff;
  border-radius: 5px 0 0 0;
  box-shadow: 0 2px 8px 0 rgba(99, 99, 99, 0.2);
  padding: 2px;
}
</style>
