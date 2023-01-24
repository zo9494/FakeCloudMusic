<template>
  <header class="header">
    <button class="close" @click="close">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x"
        viewBox="0 0 16 16">
        <path
          d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
      </svg>
    </button>
    <div class="drag"></div>
  </header>
  <div class="login">
    <main class="main">
      <p class="title">扫码登录</p>
      <div class="qr-code">
        <img v-if="qrimg" :src="qrimg">
      </div>
      <p class="tip">使用网易云音乐app扫码登录</p>
    </main>
    <div class="other">选择其它登录模式</div>
  </div>
</template>

<script setup lang="ts">
import { getQR } from '@/api/user'
import { onBeforeMount, ref } from 'vue'

const qrimg = ref()
onBeforeMount(() => {
  getQR().then(data => {
    qrimg.value = data.qrimg
  })
})

function close() {
  console.log(window);
  window.electron.window.closeLoginWin()
  window.close()
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

  >svg {
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
    width: 185px;
    display: grid;
    grid-template-rows: 50px 185px 40px;
    gap: 20px;

    .title {
      font-size: 28px;
      color: #333333;
      text-align: center;
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
</style>