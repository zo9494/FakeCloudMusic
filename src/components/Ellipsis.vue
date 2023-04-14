<template>
  <div class="ellipsis">
    <input type="checkbox" name="" id="ellipsis" class="ellipsis-input" />
    <div class="ellipsis-content">
      <label v-show="canExpand" class="ellipsis-content-control" for="ellipsis">
        <i class="bi bi-caret-up-fill caret"></i>
        <i class="bi bi-caret-down-fill caret"></i>
      </label>
      <div ref="contentRef" v-html="replaceWrapToBr(props.content)"> </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUpdate } from 'vue';
interface PropsType {
  content?: string;
}
const props = defineProps<PropsType>();

function replaceWrapToBr(content?: string) {
  return content?.replace(/\n/g, '<br>') || '';
}

function useExpand() {
  const contentRef = ref<HTMLDivElement>();
  const canExpand = ref(false);
  onMounted(() => {
    if (contentRef.value) {
      if (contentRef.value.scrollHeight > contentRef.value.clientHeight) {
        canExpand.value = true;
      } else {
        canExpand.value = false;
      }
    }
  });

  return {
    contentRef,
    canExpand,
  };
}

const { contentRef, canExpand } = useExpand();
</script>

<style lang="scss" scoped>
.ellipsis {
  &-input {
    display: none;
    &:checked + .ellipsis-content {
      > div {
        -webkit-line-clamp: unset;
      }
      .ellipsis-content-control {
        .bi-caret-down-fill {
          display: none;
        }
        .bi-caret-up-fill {
          display: inline-block;
        }
      }
    }
  }
  &-content {
    &-control {
      float: right;
      clear: both;

      .bi-caret-down-fill {
        display: inline-block;
      }
      .bi-caret-up-fill {
        display: none;
      }
    }
    > div {
      height: 100%;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      overflow: hidden;
    }
  }
}
</style>
