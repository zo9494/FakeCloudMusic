import { defineStore } from 'pinia';
import { getUserAccount, getSubCount } from '@/api/user';
import { OP, updatePlaylist } from '@/api/playlist';
import { getPlaylistDetail } from '@/api/playlist';
type UserPlaylist = Omit<Playlist, 'tracks'> & {
  tracks: Map<number, Track>;
};

interface userState {
  profile: {
    nickname?: string;
    avatarUrl?: string;
    userId?: number;
  };
  account: {
    id?: number;
  };
  order: {
    myLike: Partial<Playlist>;
    myCreate: Playlist[] | [];
    myCollect: Playlist[] | [];
  };
  userPlaylist: Partial<Playlist>;
  likeMap: Map<number, boolean>;
  refreshTime: number;
  flag: null | Promise<void>;
}
interface userActions {
  getUserAccount: () => void;
  storeUserLikePlaylist: (id: number) => void;
  hasLike: (id: number) => boolean;
  updateLike: (val: Track, isDel?: boolean) => Promise<boolean>;
}
export const useUserStore = defineStore<'user', userState, {}, userActions>(
  'user',
  {
    state: () => ({
      account: {},
      profile: {},
      // 歌单
      order: {
        myLike: {},
        myCreate: [],
        myCollect: [],
      },
      userPlaylist: {},
      likeMap: new Map(),
      refreshTime: Date.now(),
      flag: null,
    }),
    actions: {
      async getUserAccount() {
        this.flag = new Promise(async resolve => {
          const data = await getUserAccount();
          resolve();
          if (!data) {
            return;
          }
          const { profile, account } = data;
          getSubCount({ uid: profile.userId }).then(data => {
            if (!data) {
              return;
            }
            const myCollect = data.filter(
              item => item.userId !== profile.userId
            );

            const myLike = data.find(
              item =>
                item.name.indexOf('喜欢的音乐') !== -1 &&
                item.userId === profile.userId
            );
            const myCreate = data.filter(
              item =>
                item.name.indexOf('喜欢的音乐') === -1 &&
                item.userId === profile.userId
            );
            myLike?.id && this.storeUserLikePlaylist(myLike?.id);
            this.$patch({
              order: {
                myCollect,
                myCreate,
                myLike,
              },
            });
          });
          this.$patch({
            profile,
            account,
          });
        });
      },
      async storeUserLikePlaylist(id) {
        if (!id) {
          return;
        }
        const data = await getPlaylistDetail({
          id: id.toString(),
          timestamp: this.refreshTime,
        });

        if (data?.playlist) {
          data.playlist.tracks.forEach(item => {
            this.likeMap.set(item.id, true);
          });
          this.userPlaylist = data.playlist;
        }
      },
      hasLike(id) {
        return this.likeMap.has(id);
      },
      async updateLike(song, isDel) {
        this.refreshTime = Date.now();
        let op: OP = OP.add;
        if (isDel) {
          op = OP.del;
        }
        try {
          updatePlaylist({
            op,
            pid: this.order.myLike.id as number,
            tracks: song.id.toString(),
          });
          if (isDel) {
            this.likeMap.delete(song.id);
            this.userPlaylist.tracks = this.userPlaylist.tracks?.filter(
              item => item.id !== song.id
            );
          } else {
            this.likeMap.set(song.id, true);
            if (this.userPlaylist.tracks) {
              this.userPlaylist.tracks = [song, ...this.userPlaylist.tracks];
            }
          }
        } catch (error) {
          return false;
        }

        return true;
      },
    },
  }
);
