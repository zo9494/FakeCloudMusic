<template>
  <div class="nav-item">
    <ul>
      <li>
        <RouterLink draggable="false" to="/id/发现音乐">
          <SvgIcon class="icon" name="netease_logo" />
          <span>发现音乐</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink draggable="false" to="/id/播客">
          <SvgIcon class="icon-bootstrap" name="broadcast" />
          <span>播客</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink draggable="false" to="/id/私人FM">
          <SvgIcon class="icon-font" name="radio" />
          <span>私人FM</span>
        </RouterLink>
      </li>
      <li>

        <RouterLink draggable="false" to="/id/视频">
          <SvgIcon class="icon-bootstrap" name="video" />
          <span>视频</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink draggable="false" to="/id/关注">
          <SvgIcon class="icon-bootstrap" name="people" />
          <span>关注</span>
        </RouterLink>
      </li>
    </ul>
  </div>
  <div class="nav-item">
    <div class="nav-item-title">我的音乐</div>
    <ul>
      <li>
        <RouterLink draggable="false" to="/id/我喜欢的音乐">
          <SvgIcon class="icon-bootstrap" name="heart" />
          <span>我喜欢的音乐</span>
        </RouterLink>
      </li>
      <li>

        <RouterLink draggable="false" to="/id/下载管理">
          <SvgIcon class="icon-bootstrap" name="download" />
          <span>下载管理</span>
        </RouterLink>
      </li>
      <li>

        <RouterLink draggable="false" to="/id/最近播放">
          <SvgIcon class="icon-bootstrap" name="clock-history" />
          <span>最近播放</span>
        </RouterLink>
      </li>
    </ul>
  </div>
  <div class="nav-item" v-for="item in menu" :key="item.key">
    <div class="nav-item-title " v-text="item.title"></div>
    <ul>
      <li v-for="sub_menu_item in item.children" :key="sub_menu_item.key">

        <RouterLink draggable="false" :to="`/id/${sub_menu_item.title}`">
          <SvgIcon v-if="sub_menu_item.iconName" class="icon-bootstrap" :name="sub_menu_item.iconName" />
          <span>{{ sub_menu_item.title }}</span>
        </RouterLink>
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
    title: '创建的歌单',
    key: 3,
    children: [
      {
        title: "2222",
        key: 1,
        iconName: 'music-note-list'
      }
    ]
  },
  {
    title: '收藏的歌单',
    key: 4,
    iconName: 'music-note-list'

  },
]

</script>
<style lang="scss" scoped>
.nav-item {
  &-title {
    margin-left: 15px;
    color: #888888;
    font-size: 12px;
    padding: 5px 0;
  }

  li {
    .icon {
      width: 28px;
      height: 28px;
    }

    .icon-bootstrap {
      width: 28px;
      height: 16px;

    }

    .icon-font {
      width: 28px;
      height: 19px;
    }

    &:hover {
      background-color: variables.$menuHover;
    }

    a {
      display: grid;
      grid-template-columns: 35px auto;
      align-items: center;
      padding-left: 15px;
      font-size: 13px;
      line-height: 35px;
    }
  }
}

.router-link-exact-active {
  color: #e40029;
  background-color: variables.$menuActive;
}
</style>
