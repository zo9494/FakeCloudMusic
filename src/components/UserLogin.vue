<template>
  <div @contextmenu="handleContextMenu" @click="openLoginDialog">
    <div class="user">
      <div class="avatar">
        <Avatar :src="profile?.avatarUrl" />
      </div>
      <div class="user-right">
        <span> {{ profile?.userId ? profile?.nickname : '未登录' }}</span>
        <i class="bi bi-caret-right-fill" />
      </div>
    </div>
  </div>

  <NDropdown
    :options="options"
    trigger="manual"
    :x="data.x"
    :y="data.y"
    :show="data.showDropdown"
    :on-clickoutside="onClickOutSide"
  />
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick } from 'vue';
import { NDropdown } from 'naive-ui';
import Popover from '@/components/popover/Popover.vue';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';
import Avatar from '@/components/Avatar.vue';

const userStore = useUserStore();
const { profile } = storeToRefs(userStore);
const options = [
  {
    label: '退出登录',
    key: 'login out',
    props: {
      style: { padding: '0 10px' },
      onClick: logout,
    },
  },
];

const data = reactive({
  x: 0,
  y: 0,
  showDropdown: false,
});

function openLoginDialog() {
  if (!profile.value.userId) {
    window.electron.ipcRenderer.invoke('LOGIN');
  }
}

function logout() {
  data.showDropdown = false;
  localStorage.removeItem('cookie');
  window.location.reload();
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
  if (!profile.value.userId) {
    return;
  }
  data.showDropdown = false;
  nextTick().then(() => {
    data.showDropdown = true;
    data.x = e.clientX;
    data.y = e.clientY + 16;
  });
}
function onClickOutSide() {
  data.showDropdown = false;
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
