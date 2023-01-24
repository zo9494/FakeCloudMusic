<template>
  <header class="header">
    <button @click="close">close</button>
  </header>
  <div class="login">
    <main class="main">
      <p class="title">扫码登录</p>
      <div class="qr-code">
        QRcode
      </div>
      <p class="tip">使用网易云音乐app扫码登录</p>
    </main>
    <div class="other">选择其它登录模式</div>
  </div>
</template>

<script setup lang="ts">
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

    .qr-code {
      border: 1px solid red;
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
  border: 1px solid gray;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  -webkit-app-region: drag;
}
</style>