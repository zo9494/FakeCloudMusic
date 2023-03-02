<template>
  <span class="f-input">
    <div class="f-input-prefix" @click="handleClear">
      <i class="bi bi-x-lg icon" v-if="props.modelValue" />
      <i class="bi bi-search icon" v-else />
    </div>
    <input
      type="text"
      :value="props.modelValue"
      @input="handleInput"
      :placeholder="props.placeholder"
    />
  </span>
</template>

<script setup lang="ts">
import { InputHTMLAttributes } from 'vue';
interface InputProps {
  placeholder?: any;
  modelValue?: any;
}

interface InputEmits {
  (e: 'update:modelValue', payload: any): void;
}

const props = defineProps<InputProps>();
const emit = defineEmits<InputEmits>();
function handleInput(e: Event) {
  emit('update:modelValue', (e.target as InputHTMLAttributes)?.value);
}
function handleClear() {
  props.modelValue && emit('update:modelValue', '');
}
</script>

<style lang="scss">
.f-input {
  background-color: #ededed;
  padding: 2px 3px;
  border-radius: 50px;
  color: #333333;
  display: grid;
  grid-template-columns: 15px auto;
  place-items: center;

  &-prefix {
    width: 100%;

    .icon {
      width: 11px;
      height: 11px;
    }
  }

  input {
    color: #333333;
    font-size: 12px;
    width: 120px;
    border: none;
    outline-style: none;
    background-color: transparent;
    cursor: text;
  }
}
</style>
