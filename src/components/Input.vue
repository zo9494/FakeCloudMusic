<template>
  <span class="f-input">
    <div class="f-input-prefix">
      <i class="bi bi-search icon" @click="handleSearch" />
    </div>
    <input
      type="text"
      :value="props.modelValue"
      @input="handleInput"
      :placeholder="props.placeholder"
    />

    <div class="f-input-suffix">
      <i class="bi bi-x-lg icon" v-if="props.modelValue" @click="handleClear" />
    </div>
  </span>
</template>

<script setup lang="ts">
import { InputHTMLAttributes } from 'vue';
interface InputProps {
  placeholder?: any;
  modelValue?: any;
  onSearch?: () => any;
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
function handleSearch(e: MouseEvent) {
  if (props.onSearch) {
    e.stopPropagation();
    props.onSearch?.();
  }
}
</script>

<style lang="scss">
.f-input {
  height: 100%;
  width: 100%;
  background-color: var(--input-color);
  padding: 0px 3px;
  border-radius: 50px;
  color: var(--input-text-color);
  display: flex;
  &-prefix {
    display: flex;
    align-items: center;
  }
  &-suffix {
    display: flex;
    align-items: center;
  }
  input {
    width: 100%;
    height: 100%;
    color: var(--input-text-color);
    font-size: 12px;
    border: none;
    outline-style: none;
    background-color: transparent;
    cursor: text;
    &::placeholder {
      opacity: 0.5;
      color: var(--input-text-color);
    }
  }
}
</style>
