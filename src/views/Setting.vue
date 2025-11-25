<template>
  <main class="setting">
    <h2 class="setting-title">设置</h2>

    <section>
      <h4>下载设置</h4>
      <h6>下载目录:</h6>
    </section>

    <section class="cache">
      <h4>缓存目录：</h4>
      <div class="cache-slider">
        <h4>缓存已用：</h4>
        <div class="cache-slider-wrapper">
          <NProgress :percentage="cacheUsed" />
          <NButton size="tiny" :loading="data.clearing" @click="clearCache"
            >清理缓存</NButton
          >
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { NSlider, NButton, NProgress } from 'naive-ui';
import { reactive, computed, onBeforeMount } from 'vue';
import { round } from 'lodash-es';
const data = reactive({
  clearing: false,
  usedCacheSize: 0,
  maxCacheSize: 0,
});

onBeforeMount(updateCacheSize);

// 缓存已用
const cacheUsed = computed(() => {
  return (data.usedCacheSize / data.maxCacheSize) * 100;
});

async function updateCacheSize() {
  const { usedSize, maxSize } = await window.electron.ipcRenderer.invoke<{
    usedSize: number;
    maxSize: number;
  }>('APP:CACHE_SIZE');

  data.usedCacheSize = round(usedSize / 1024 / 1024 / 1024, 2);
  data.maxCacheSize = maxSize / 1024 / 1024 / 1024;
  console.log({ usedSize, maxSize });
}

async function clearCache() {
  try {
    data.clearing = true;
    await window.electron.ipcRenderer.invoke('APP:CACHE_CLEAR');
    updateCacheSize();
  } catch (error) {
  } finally {
    data.clearing = false;
  }
}
</script>

<style scoped lang="scss">
.setting {
  padding: 0 10px;

  &-title {
    margin: 0;
  }
  .cache {
    &-size {
      font-size: 12px;
    }
    &-slider {
      max-width: 400px;
      &-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }
  }
}
</style>
