<template>
  <div class="user">
    <div class="avatar">
      <SvgIcon name="user_90"></SvgIcon>
    </div>
    <div class="user-right">
      <span>未登录</span>
      <SvgIcon name="caret-right-fill"></SvgIcon>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  setup() {


    return {}
  }
}
</script>

<style lang="scss" scoped>
.user {
  display: grid;
  grid-template-columns: 40px auto;
  grid-template-rows: 40px;
  font-size: 14px;
  padding-left: 10px;
  padding-top: 5px;

  .avatar {
    border-radius: 50%;
    border: 1px solid #bfbfbf;
    display: grid;
    place-items: center;

    >svg {
      height: 30px;
      width: 30px;
      margin-bottom: 10px;
    }
  }

  .user-right {
    line-height: 40px;
    margin-left: 10px;

    >svg {
      color: #8e8e8e;
      width: 10px;
      height: 10px;
    }
  }
}
</style>