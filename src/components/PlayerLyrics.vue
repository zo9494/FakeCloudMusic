<template>
  <div
    v-show="visible"
    class="f-lyrics-bg"
    :style="{
      backgroundImage: `linear-gradient(0deg,rgb(${data.bgColor.join(
        ','
      )}),rgb(245,245,245))`,
    }"
  >
    <div class="f-lyrics">
      <div class="f-lyrics-header">
        <div>
          <slot name="header"></slot>
        </div>
        <div class="f-lyrics-header-title">
          <p class="name">{{ props.song?.name || 'unknown' }}</p>
          <p class="arName">{{ props.song?.arName || 'unknown' }}</p>
        </div>
      </div>
      <div class="f-lyrics-body">
        <div class="f-lyrics-body-left">
          <ImageComponent
            class="cover"
            :src="props.song?.al?.picUrl + '?param=512y512'"
          />
          <slot name="options"></slot>
        </div>
        <div class="f-lyrics-body-right scrollbar" ref="scrollRef">
          <p :style="{ height: `${data.viewHeight / 4}px` }"></p>
          <div
            v-for="(item, index) in props.lyrics"
            :key="item.time"
            :class="[
              data.currentIndex === index ? 'item-active' : null,
              'item',
            ]"
          >
            <p class="item-lyric">{{ item.lyric }}</p>
            <p class="item-tlyric">{{ item.tlyric }}</p>
          </div>
          <p :style="{ height: `${data.viewHeight / 4}px` }"></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, reactive, ref } from 'vue';
import ImageComponent from '@/components/PlaylistImage.vue';
interface Props {
  progress: number;
  lyrics?: Lyric[];
  song?: Partial<Track>;
  visible: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  lyrics: () => [],
  visible: true,
});
const data = reactive({
  currentIndex: -1,
  viewHeight: 400,
  bgColor: [245, 245, 245],
});

const scrollRef = ref<HTMLDivElement>();
watch(
  () => props.visible,
  val => {
    if (val && scrollRef.value?.offsetHeight) {
      data.viewHeight = scrollRef.value.offsetHeight;
    }
  }
);

watch(
  () => props.progress,
  val => {
    if (props.lyrics.length > 1) {
      let index = props.lyrics.length - 1;
      for (index; index >= 0; index--) {
        if (val >= props.lyrics[index].time) {
          break;
        }
      }
      data.currentIndex = index;
    } else {
      data.currentIndex = 0;
    }
  }
);

watch(() => data.currentIndex, handleScroll);

watch(
  () => props.song?.al?.picUrl,

  val => {
    resetData();
    if (val) {
      loadImg(val + '?param=512y512').then(rgb => {
        data.bgColor = rgb;
      });
    }
  }
);

function loadImg(url: string) {
  return new Promise<number[]>(resolve => {
    let img = new Image();
    img.src = url;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve(getImageColor(img));
    };
  });
}
function getImageColor(img: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  let context = canvas.getContext('2d');
  if (!context) {
    return [245, 245, 245];
  }

  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  // 获取像素数据
  let data = context.getImageData(0, 0, img.width, img.height).data;
  let r = 1,
    g = 1,
    b = 1;
  // 取所有像素的平均值
  for (var row = 0; row < img.height; row++) {
    for (var col = 0; col < img.width; col++) {
      if (row == 0) {
        r += data[img.width * row + col];
        g += data[img.width * row + col + 1];
        b += data[img.width * row + col + 2];
      } else {
        r += data[(img.width * row + col) * 4];
        g += data[(img.width * row + col) * 4 + 1];
        b += data[(img.width * row + col) * 4 + 2];
      }
    }
  }

  // 求取平均值
  r /= img.width * img.height;
  g /= img.width * img.height;
  b /= img.width * img.height;

  // 将最终的值取整
  r = Math.round(r);
  g = Math.round(g);
  b = Math.round(b);
  console.log(r, g, b);
  return [r, g, b];
}

function handleScroll() {
  if (scrollRef.value) {
    if (data.currentIndex === -1) {
      scrollRef.value.scrollTop = 0;
      return;
    }
    try {
      const currentEl = document.querySelector(
        '.item-active'
      ) as HTMLDivElement;
      scrollRef.value.scrollTop =
        currentEl.offsetTop - scrollRef.value.offsetHeight / 1.4;
    } catch {}
  }
}

function resetData() {
  data.currentIndex = -1;
}

defineExpose({ handleScroll });
</script>

<style lang="scss">
#bg {
  position: absolute;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}
.f-lyrics {
  &-bg {
    // background-color: whitesmoke;
    // background-size: cover;
    position: relative;
  }
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  padding: 40px 30px 30px;
  background-color: rgba(255, 255, 255, 0.6);
  display: grid;
  gap: 10px;
  grid-template-rows: 100px calc(100% - 110px);
  overflow: hidden;

  &-header {
    display: flex;
    flex-direction: column;

    .name,
    .arName {
      text-align: center;
      margin: 5px 0;
    }

    .name {
      font-size: 18px;
      font-weight: bolder;
    }
  }

  &-body {
    display: grid;
    grid-template-columns: 2fr 2.1fr;
    height: 100%;
    gap: 60px;

    &-left {
      display: grid;
      grid-template-rows: 240px auto;
      gap: 40px;
      justify-items: center;

      .cover {
        height: 240px;
        width: 240px;

        img {
          border-radius: 10px;
        }
      }
    }

    &-right {
      width: 98%;
      .item {
        margin: 15px 0;
        transition: all ease-in-out 220ms;
        p {
          margin: 4px 0;
        }
        &-active {
          font-weight: bold;
          font-size: 16px;
        }
      }
    }
  }
}
</style>
