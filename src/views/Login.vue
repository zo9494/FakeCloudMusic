<template>
  <header class="header">
    <button class="close" @click="close">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-x"
        viewBox="0 0 16 16"
      >
        <path
          d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
        />
      </svg>
    </button>
    <div class="drag"></div>
  </header>
  <div class="login">
    <main class="main">
      <p class="title">扫码登录</p>
      <div class="qr-code">
        <div>
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
    <div class="other" v-show="stepCode !== '2'">选择其它登录模式</div>
  </div>
</template>

<script setup lang="ts">
import { getQR, checkStatus } from '@/api/user';
import { onBeforeMount, Ref, ref } from 'vue';
import img from '@/assets/img/login.png';
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

onBeforeMount(init);

function init() {
  getQR()
    .then(data => {
      qrimg.value = data.qrimg;
      return data.key;
    })
    .then(key => {
      checkQRStatus(key);
    });
}

function close() {
  window.clearTimeout(timer.value);
  window.electron.window.closeLoginWin();
  window.close();
}

function checkQRStatus(key: string) {
  timer.value = window.setTimeout(async () => {
    const { code, cookie } = await checkStatus(key);
    if (code === 803) {
      localStorage.cookie = cookie;
      window.clearTimeout(timer.value);
      window.electron.reloadUser();
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
}

.close {
  display: grid;
  place-items: center;
  outline-style: none;
  background-color: transparent;
  border: none;
  cursor: pointer;
  height: 20px;
  width: 20px;

  > svg {
    cursor: pointer;
  }
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
  grid-template-columns: 50px auto;
}

.drag {
  -webkit-app-region: drag;
}

.scanned {
  transform: translateX(-430px);
}
</style>
