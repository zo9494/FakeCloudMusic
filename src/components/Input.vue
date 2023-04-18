<template>
  <span class="f-input">
    <div class="f-input-prefix">
      <i class="bi bi-x-lg icon" v-if="props.modelValue" @click="handleClear" />
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
  height: 100%;
  width: 100%;
  background-color: var(--input-color);
  padding: 2px 3px;
  border-radius: 50px;
  color: var(--input-text-color);
  display: grid;
  grid-template-columns: 15px auto;
  place-items: center;

  &-prefix {
    width: 100%;
    text-align: center;
    .icon {
      width: 11px;
      height: 11px;
    }
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
