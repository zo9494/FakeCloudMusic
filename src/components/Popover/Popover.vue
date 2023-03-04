<template>
  <Trigger @click="onClick" ref="triggerRef">
    <slot v-if="$slots.reference" name="reference"></slot>
  </Trigger>

  <!-- <button @click="test(1)">
    1
    <button @click.capture="test(2)"
      >2

      <button @click="test(3)">3</button>
    </button>
  </button> -->

  <teleport to=".f-popover-container">
    <div class="f-popover" v-show="data.isShow" ref="popoverRef">
      <slot></slot>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import Trigger from './Trigger';
import { onMounted, ref, reactive } from 'vue';
import { createPopper, Instance } from '@popperjs/core';
enum trigger {
  click = 'click',
  hover = 'hover',
}
interface PropsType {
  trigger?: keyof typeof trigger;
}
const props = withDefaults(defineProps<PropsType>(), {
  trigger: 'click',
});

interface DataType {
  popperInstance?: Instance;
  isShow: boolean;
}
const data = reactive<DataType>({
  isShow: false,
});
let el = document.querySelector('.f-popover-container');
if (!el) {
  el = document.createElement('div');
  el.className = 'f-popover-container';
  document.body.appendChild(el);
}

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
    data.isShow = !data.isShow;
    if (data.isShow) {
      window.addEventListener('click', globalEvent, { capture: true });
      data.popperInstance?.update();
    } else {
      window.removeEventListener('click', globalEvent, { capture: true });
    }
  }
}

function globalEvent() {
  data.isShow = false;
}
</script>

<style lang="scss">
.f-popover {
  background-color: #fff;
  border-radius: 5px 0 0 0;
  box-shadow: 0 2px 8px 0 rgba(99, 99, 99, 0.2);
  padding: 12px;
}
</style>
