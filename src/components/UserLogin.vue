<template>
  <Popover
    :show="visible"
    trigger="manual"
    placement="right"
    :on-clickoutside="clickOutSide"
  >
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
        <li @click="logout">退出登录</li>
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

const userStore = useUserStore();
const { profile } = storeToRefs(userStore);

onBeforeMount(() => {
  userStore.getUserAccount();
});
const visible = ref(false);
function openLogin() {
  if (!profile.value.userId) {
    window.electron.ipcRenderer.invoke('LOGIN');
    // window.electron.window.createLoginWin();
  } else {
    visible.value = true;
  }
}

function clickOutSide() {
  visible.value = false;
}
function logout() {
  localStorage.removeItem('cookie');
  window.location.reload();
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
  ul {
    li {
      padding: 8px 0 8px 15px;
      &:hover {
        background-color: var(--menu-hover-bg-color);
      }
    }
  }
}
</style>
