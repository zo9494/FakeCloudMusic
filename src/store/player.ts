import { defineStore } from 'pinia';
import { getSongDetail, getLyric, getSongUrl } from '@/api/song';
import { getArName } from '@/utils/utils';
interface PlayerState {
  currentSong: {
    index: number;
    song?: Partial<Track>;
    songUrl?: Partial<SongUrl>;
  };
  playlist: Track[];
  lyrics?: Lyric[];
}

interface PlayerActions {
  play: (index: number, playlist?: Track[]) => void;
  next: () => void;
  previous: () => void;
  setCurrentSong: () => void;
}

export const usePlayerStore = defineStore<
  'player',
  PlayerState,
  {},
  PlayerActions
>('player', {
  state: () => ({
    currentSong: {
      index: 0,
    },
    playlist: [],
    lyrics: [],
  }),
  actions: {
    play(index, playlist = []) {
      if (playlist?.length) {
        this.$patch({ playlist });
      }
      this.$patch({ currentSong: { index } });
      this.setCurrentSong();
    },
    next() {
      if (this.currentSong?.index >= this.playlist?.length) {
        return;
      }
      this.play(this.currentSong.index + 1);
    },
    previous() {
      if (this.currentSong.index === 0) {
        return;
      }
      this.play(this.currentSong.index - 1);
    },
    setCurrentSong() {
      if (!this.playlist) {
        return;
      }
      this.$patch({
        currentSong: {
          song: undefined,
          songUrl: undefined,
        },
      });
      const { id } = this.playlist[this.currentSong.index || 0];
      getSongDetail(id).then(song => {
        song.arName = getArName(song.ar);
        this.$patch({
          currentSong: {
            song,
          },
        });
      });
      getSongUrl(id).then(songUrl => {
        this.$patch({
          currentSong: {
            songUrl,
          },
        });
      });
      getLyric(id).then(lyrics => {
        this.$patch({ lyrics });
      });
    },
  },
});
