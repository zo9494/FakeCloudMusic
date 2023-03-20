<template>
  <Popover placement="right">
    <template #reference>
      <div class="user" @click="openLogin">
        <div class="avatar">
          <Avatar :src="profile?.avatarUrl" />
          <!-- <img v-if="profile?.userId" :src="profile?.avatarUrl">
      <div v-else>
        <SvgIcon name="user_90" />
      </div> -->
        </div>
        <div class="user-right">
          <span> {{ profile?.userId ? profile?.nickname : '未登录' }}</span>
          <i class="bi bi-caret-right-fill" />
        </div>
      </div>
    </template>

    <div class="menu">
      <ul>
        <li>退出登录</li>
      </ul>
    </div>
  </Popover>
</template>

<script lang="ts" setup>
import { onBeforeMount, ref } from 'vue';
import Popover from '@/components/popover/Popover.vue';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';
import Avatar from '@/components/Avatar.vue';
import { message } from '@/components/message/message';
const userStore = useUserStore();
const { profile } = storeToRefs(userStore);

onBeforeMount(() => {
  userStore.getUserAccount();
});

function openLogin() {
  message();
  if (!profile.value.userId) {
    window.electron.window.createLoginWin();
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
    height: 40px;
    width: 40px;
    display: grid;
    place-items: center;
    overflow: hidden;

    // >div {
    //   background-color: #e0e0e0;
    //   height: 40px;
    //   width: 40px;
    //   border-radius: 50%;
    //   border: 1px solid #bfbfbf;
    //   overflow: hidden;
    // }

    // svg {
    //   height: 30px;
    //   width: 30px;
    //   margin-bottom: 10px;
    //   margin-left: 4px;
    // }

    // >img {
    //   height: 40px;
    //   width: 40px;
    //   border-radius: 50%;
    // }
  }

  .user-right {
    line-height: 40px;
    margin-left: 10px;

    > svg {
      color: #8e8e8e;
      width: 10px;
      height: 10px;
    }
  }
}

.menu {
  width: 300px;
  padding: 10px 0;
}
</style>
