<template>
  <div class="close_tip">
    <p class="close_tip-header"> 关闭提示 </p>
    <div class="close_tip-body">
      <NRadioGroup v-model:value="exit" class="close_tip-body-content">
        <NRadio
          :theme-overrides="radioThemeOverrides"
          :value="false"
          label="最小化到系统托盘"
        ></NRadio>
        <NRadio
          :theme-overrides="radioThemeOverrides"
          :value="true"
          label="退出播放器"
        ></NRadio>
      </NRadioGroup>
    </div>
    <div class="close_tip-footer">
      <div class="close_tip-footer-content">
        <NCheckbox
          :theme-overrides="checkboxThemeOverrides"
          :checked="rememberSelect"
          :on-update:checked="
            val => {
              rememberSelect = val;
            }
          "
          >不再提醒</NCheckbox
        >
        <button class="confirm" @click="handleConfirm">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  NRadio,
  NCheckbox,
  NRadioGroup,
  RadioGroupProps,
  CheckboxProps,
} from 'naive-ui';

const exit = ref(false);
const rememberSelect = ref(false);
type RadioThemeOverrides = NonNullable<RadioGroupProps['themeOverrides']>;
type CheckboxThemeOverrides = NonNullable<CheckboxProps['themeOverrides']>;
const radioThemeOverrides: RadioThemeOverrides = {
  dotColorActive: '#ec4141',
  boxShadowHover: 'inset 0 0 0 1px #ec4141',
  boxShadowActive: 'inset 0 0 0 1px #ec4141',
  boxShadowFocus: 'inset 0 0 0 1px #ec4141',
};
const checkboxThemeOverrides: CheckboxThemeOverrides = {
  colorChecked: '#ec4141',
  borderChecked: '1px solid #ec4141',
  borderFocus: 'var(--n-border)',
  boxShadowFocus: 'unset',
};
interface PropsType {
  confirm?: (exit: boolean) => void;
}
const props = defineProps<PropsType>();
function handleConfirm() {
  props.confirm?.(exit.value);
}
</script>

<style scoped lang="scss">
.close_tip {
  padding: 10px 0;
  font-size: 14px;
  &-header {
    margin: 0;
    text-align: center;
    font-weight: bold;
  }
  &-body {
    margin: 20px 0;
    &-content {
      display: grid;
      justify-content: center;
      gap: 10px;
      grid-template-columns: 150px;
      grid-template-rows: auto auto;
    }
  }
  &-footer {
    &-content {
      padding: 0 50px;
      display: flex;
      justify-content: space-between;
    }
    .confirm {
      cursor: pointer;
      width: 80px;
      color: #fff;
      border-radius: 100px;
      padding: 8px 0;
      background-color: #ec4141;
      &:hover {
        background-color: #d83535;
      }
    }
  }
}
</style>
