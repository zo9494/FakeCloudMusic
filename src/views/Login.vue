<template>
  <header v-if="showCustomFrame" class="header">
    <div class="drag"></div>
    <button class="close" @click="close">
      <i class="icon-fluent icon-fluent-chrome-close" />
    </button>
  </header>
  <div class="login">
    <main class="main">
      <p class="title">扫码登录</p>
      <div class="qr-code">
        <div>
          <Loading v-if="loading"></Loading>
          <img v-if="qrimg && stepCode !== '2'" :src="qrimg" />
          <img v-else-if="stepCode === '2'" class="scanned" :src="img" />
          <div class="out-date" v-show="stepCode === '0'">
            <p>二维码已过期</p>
            <button class="refresh" @click="refresh">点击刷新</button>
          </div>
        </div>
        <p class="qr-code-msg">{{ steps[stepCode].msg }}</p>
      </div>
      <p class="tip">{{ steps[stepCode].tip }}</p>
    </main>
    <!-- <div class="other" v-show="stepCode !== '2'">选择其它登录模式</div> -->
  </div>
</template>

<script setup lang="ts">
import { getQR, checkStatus } from '@/api/user';
import { onBeforeMount, Ref, ref } from 'vue';
import img from '@/assets/img/login.png';
import Loading from '@/components/Loading.vue';
let showCustomFrame = false;

if (process.platform == 'win32') {
  showCustomFrame = true;
}
const qrimg = ref();
const timer = ref(0);
/**
 * 0 - 二维码过期
 * 1 - 等待扫码
 * 2 - 待确认
 */
const steps = {
  0: {
    msg: '',
    tip: '使用网易云音乐app扫码登录',
  },
  1: {
    msg: '',
    tip: '使用网易云音乐app扫码登录',
  },
  2: {
    msg: '扫描成功',
    tip: '请在手机上确认登录',
  },
};
/**
 * 0 - 二维码过期
 * 1 - 等待扫码
 * 2 - 待确认
 */
const stepCode: Ref<'0' | '1' | '2'> = ref('1');
const loading: Ref<boolean> = ref(true);

onBeforeMount(init);

function init() {
  getQR()
    .then(data => {
      qrimg.value = data.qrimg;
      return data.key;
    })
    .then(key => {
      if (!key) {
        return;
      }
      checkQRStatus(key);
    })
    .finally(() => {
      loading.value = false;
    });
}

function close() {
  window.clearTimeout(timer.value);
  window.electron.ipcRenderer.invoke('WINDOW_CLOSE', window.windowOptions.id);
}

function checkQRStatus(key: string) {
  window.clearTimeout(timer.value);
  timer.value = window.setTimeout(async () => {
    const data = await checkStatus(key);
    if (!data) {
      return;
    }
    const { code, cookie } = data;
    if (code === 803) {
      localStorage.cookie = cookie;
      // window.electron.reloadUser();
      window.electron.ipcRenderer.invoke('RELOAD_USER');
      close();
      return;
    }
    if (code === 800) {
      stepCode.value = '0';
      return;
    }
    if (code === 802) {
      stepCode.value = '2';
    }
    checkQRStatus(key);
  }, 2000);
}

function refresh() {
  init();
  stepCode.value = '1';
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  cursor: default;
  user-select: none;
  box-sizing: border-box;
  font-size: 12px;
}

.close {
  display: grid;
  place-items: center;
  outline-style: none;
  background-color: transparent;
  border: none;
  height: 20px;
  width: 20px;
}

.login {
  height: 100vh;
  width: 100vw;
  display: grid;
  place-items: center;
  color: #666666;

  .main {
    width: 190px;
    display: grid;
    grid-template-rows: 50px 190px 30px;
    gap: 30px;
    overflow: hidden;

    .title {
      font-size: 28px;
      color: #333333;
      text-align: center;
    }

    .qr-code {
      > div {
        width: 180px;
        height: 100%;
        overflow: hidden;
        position: relative;
      }

      .out-date {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.8);
        display: grid;
        place-items: center;
        color: #fff;
      }

      &-msg {
        font-size: 13px;
        margin-top: -20px;
        text-align: center;
      }

      .refresh {
        color: #fff;
        background-color: #e40029;
        border: none;
        padding: 5px 10px;
        border-radius: 20px;
      }
    }

    .tip {
      font-size: 14px;
      text-align: center;
    }
  }

  .other {
    font-size: 12px;
    text-align: center;
  }
}

.header {
  height: 25px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: auto 25px;
}

.drag {
  -webkit-app-region: drag;
}

.scanned {
  transform: translateX(-430px);
}
</style>
