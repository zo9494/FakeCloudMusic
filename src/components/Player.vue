<script lang="ts" setup>
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'
import { getSongDetail, getSongUrl } from "@/api/song";
import { reactive, onBeforeMount, ref } from "vue";

const progress = ref<number>(0)
const heart = ref<boolean>(false)
const pause = ref<boolean>(false)

type Props = Partial<Omit<SongUrl, 'id'> & Track>

// const props = withDefaults(defineProps<{ picUrl: string }>(), {
//   picUrl: ''
// })
const props = reactive<{ song: Partial<Track> }>({
  song: {}
})

onBeforeMount(async () => {
  getSongDetail(1811662859).then((song) => {
    props.song = song
  });
  const songUrl = getSongUrl(1811662859)

})
</script>

<template>
  <div class="f-player">
    <div class="f-player-info">
      <div class="f-player-info-cover">
        <img :src="props.song.al?.picUrl" alt="">
      </div>
      <div class="f-player-info-song">
        <p class="f-player-info-song-name">{{ props.song.name }}</p>
        <p class="f-player-info-song-ar">{{
          props.song.ar?.map(it => it.name).join('/')
        }}</p>
      </div>
    </div>

    <div class="f-player-heart">
      <span @click="heart = !heart">
        <SvgIcon v-if="heart" name="heart-fill" class="heart-fill" />
        <SvgIcon v-else name="heart" class="heart" />
      </span>

    </div>

    <div class="f-player-control">
      <button class="f-player-control-previous f-player-control-btn">
        <SvgIcon name="previous" />
      </button>
      <button class="f-player-control-pau-pla f-player-control-btn" @click="pause = !pause">
        <SvgIcon v-show="pause" name="pause" />
        <SvgIcon v-show="!pause" name="play" />
      </button>
      <button class="f-player-control-next f-player-control-btn">
        <SvgIcon name="next" />
      </button>
    </div>

    <div class="f-player-progress">
      <span>0:00</span>
      <div class="f-player-progress-bar">
        <VueSlider v-model="progress" tooltip="none">
        </VueSlider>
      </div>
      <span>0:00</span>
    </div>

    <div class="f-player-right-control">
      <button class="f-player-right-control-list">
        <SvgIcon name="list" />
      </button>
      <div class="f-player-right-control-volume">
        <SvgIcon class="f-player-right-control-volume-icon" name="volume-down" />
        <VueSlider class="f-player-right-control-volume-bar" v-model="progress" tooltip="none">
        </VueSlider>
      </div>

    </div>

  </div>
</template>



<style lang="scss" scoped>
button {
  margin: 0;
  padding: 0;
  background-color: transparent;
  color: #666666;
}

.f-player {
  color: #666666;
  padding: 5px 10px;
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: 160px 25px 130px auto 300px;
  background-color: rgba(#fff, 0.6);
  backdrop-filter: blur(3px);
  gap: 10px;
  place-items: center;
  border-top: 1px solid #d1d1d1;

  &-info {
    display: grid;
    grid-template-columns: 45px 100px;
    gap: 5px;
    border: 1px solid bisque;

    &-cover {
      width: 45px;
      height: 45px;

      img {
        width: 100%;
        height: 100%;
        border-radius: 10px;
      }
    }

    &-song {
      display: grid;
      grid-template-rows: repeat(2, 1fr);
      align-items: center;

      p {
        margin: 0;
        overflow: hidden;
        white-space: nowrap;
      }

      &-name {
        font-weight: bold;
      }

      &-ar {
        font-size: 12px;
        color: #666666;
      }
    }
  }

  &-heart {
    display: grid;
    place-items: center;

    .heart {
      color: #666666;

      &-fill {
        color: #ec4141;
      }
    }

    svg {
      width: 15px;
      height: 15px;
    }
  }

  &-control {
    display: grid;
    grid-template-columns: 30px 40px 30px;
    place-items: center;
    height: 100%;
    gap: 5px;

    &-btn {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border-radius: 10px;

      &:hover {
        background-color: rgba(209, 209, 214, 0.28);
      }

      svg {
        width: 20px;
        height: 20px;
      }
    }

    &-pau-pla {
      height: 40px;
      width: 40px;

      svg {
        width: 30px;
        height: 30px;
      }
    }


  }

  &-progress {
    width: 100%;
    display: grid;
    grid-template-columns: 40px auto 40px;
    font-size: 12px;
    color: #888888;
    place-items: center;

    &-bar {
      width: 100%;
    }
  }

  &-right-control {
    display: grid;
    grid-template-columns: 25px auto;
    gap: 5px;

    &-volume {
      width: 100px;
      display: grid;
      grid-template-columns: 30px auto;
      align-items: center;

      &-icon {
        width: 30px;
        height: 30px;
      }

      &-bar {
        width: 100%;
      }
    }

    &-list {
      width: 100%;
      display: grid;
      place-items: center;

      svg {
        width: 25px;
        height: 25px;
      }
    }
  }
}

.progress-dot {
  width: 50%;
  height: 50%;
  border-radius: 100%;
  background-color: #ec4141;
  transition: all .3s;
}

.progress-dot:hover {
  transform: rotateZ(45deg);
}

.progress-dot.focus {
  border-radius: 50%;
}
</style>