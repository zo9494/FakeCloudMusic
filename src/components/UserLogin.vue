<template>
  <Popover :visible="visible" placement="right">
    <template #reference>
      <div class="user" @click="open">
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
const userStore = useUserStore();
const { profile } = storeToRefs(userStore);
const visible = ref<boolean>(false);
onBeforeMount(() => {
  userStore.getUserAccount();
});

function open() {
  if (profile.value.userId) {
    showPopover();
  } else {
    window.electron.window.createLoginWin();
  }
}

function showPopover() {
  visible.value = !visible.value;
  if (visible.value) {
    window.addEventListener('click', clickEvent, { capture: true });
  } else {
    window.removeEventListener('click', clickEvent, { capture: true });
  }
}

function clickEvent(e: MouseEvent) {
  const el = document.querySelector('.f-popover-container') as HTMLDivElement;
  const isSelf = el?.contains(e.target as HTMLElement);
  if (!isSelf) {
    visible.value = false;
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
