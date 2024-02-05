<template>
  <div class="search-suggest-list">
    <div class="search-suggest-list-header">
      <i :class="OrderType[props.type].icon"></i>
      <span>{{ OrderType[props.type].text }}</span>
    </div>
    <div class="search-suggest-list-body">
      <slot name="item">
        <div
          class="search-suggest-list-body-item"
          v-for="item in props.data"
          :key="item.id"
          @click="handleClick(item)"
        >
          <span v-if="props.type === 'songs'">{{ getSongName(item) }}</span>
          <span v-else-if="props.type === 'albums'">{{
            getAlbumName(item)
          }}</span>

          <span v-else>{{ item.name }}</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';

import type { SearchInjection } from '@/components/search/Search.vue';
const Search = inject('SearchInjection') as SearchInjection;
const OrderType: { [propName: string]: { [propName: string]: string } } = {
  albums: {
    text: '专辑',
    icon: 'bi bi-disc',
  },
  artists: {
    text: '歌手',
    icon: 'bi bi-person',
  },
  songs: {
    text: '单曲',
    icon: 'bi bi-music-note',
  },
  playlists: {
    text: '歌单',
    icon: 'bi bi-music-note-list',
  },
  default: {
    text: '猜你想搜',
    icon: 'bi bi-search',
  },
};
interface BaseType {
  id: number;
  name: string;
}
type data =
  | HotSearchSuggest.Album[]
  | HotSearchSuggest.Artist[]
  | HotSearchSuggest.Song[]
  | HotSearchSuggest.Playlist[]
  | BaseType[]
  | any[];
interface PropsType {
  type?: string;
  data?: data;
}

const props = withDefaults(defineProps<PropsType>(), {
  type: 'default',
});

function getSongName(song: HotSearchSuggest.Song) {
  let de = song.alias.join('/');
  if (de) {
    de = `(${de})`;
  }
  const artists = song.artists.map(item => item.name).join('/');

  return `${song.name} ${de} - ${artists}`;
}

function getAlbumName(album: HotSearchSuggest.Album) {
  return `${album.name} - ${album.artist.name}`;
}

function handleClick(item: any) {
  console.log(item);
  Search.changSearchValue(item.name);
}
</script>

<style lang="scss">
.search-suggest-list {
  font-size: 14px;
  font-weight: 100;
  color: var(--menu-title-color);
  .bi {
    margin: 0 5px;
  }
  &-header {
    padding-left: 10px;
    margin: 10px 0;
  }
  &-body {
    &-item {
      height: 35px;
      line-height: 35px;
      padding-left: 40px;
      overflow: hidden;
      color: var(--font-color);
      font-size: 12.5px;
      &:hover {
        background-color: var(--menu-hover-bg-color);
      }
    }
  }
}
</style>
