<template>
  <div class="nav-item">
    <ul>
      <li>
        <SvgIcon class="icon" name="netease_logo" />
        <RouterLink to="`/id/${sub_menu_item.title}`">发现音乐</RouterLink>
      </li>
      <li>
        <SvgIcon class="icon-bootstrap" name="broadcast" />
        <RouterLink to="`/id/${sub_menu_item.title}`">播客</RouterLink>
      </li>
    </ul>
  </div>
  <div class="nav-item" v-for="item in menu" :key="item.key">
    <span class="nav-item-title " v-text="item.title"></span>
    <ul>
      <li v-for="sub_menu_item in item.children" :key="sub_menu_item.key">
        <SvgIcon class="icon" :name="sub_menu_item.iconName"></SvgIcon>
        <RouterLink :to="`/id/${sub_menu_item.title}`">{{ sub_menu_item.title }}</RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router"

interface menuType {
  key: number | string,
  title?: string,
  children?: menuType[],
  iconName?: string
}
const menu: menuType[] = [
  {
    key: 1,
    children: [
      {
        title: '发现音乐',
        key: 1,
        iconName: 'netease_logo'
      },
      {
        title: '播客',
        key: 2,
        iconName: 'broadcast'

      },
      {
        title: '私人FM',
        key: 3,
        iconName: 'netease_logo'

      },
      {
        title: '视频',
        key: 4,
        iconName: 'netease_logo'

      },
      {
        title: '关注',
        key: 5,
        iconName: 'netease_logo'

      },
    ]
  },
  {
    title: '我的音乐',
    key: 2,
    children: [
      {
        title: '我喜欢的音乐',
        key: 1
      },
      {
        title: '下载管理',
        key: 2

      },
      {
        title: '最近播放',
        key: 3
      },
    ]
  },
  {
    title: '创建的歌单',
    key: 3,
  },
  {
    title: '收藏的歌单',
    key: 4,
  },
]

</script>
<style lang="scss" scoped>
.nav-item {
  &-title {
    margin-left: 15px;
    color: #888888;
    font-size: 12px;
  }

  li {
    display: grid;
    grid-template-columns: 30px auto;
    padding-left: 15px;
    place-items: center;

    .icon {
      width: 30px;
      height: 30px;
    }

    .icon-bootstrap {
      width: 18px;
      height: 18px;
    }

    &:hover {
      background-color: #e1e1e1;
    }

    a {
      padding: 8px 0;
      display: block;
      width: 100%;
      height: 100%;
    }
  }
}
</style>
