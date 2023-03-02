import { defineStore } from 'pinia';
import { getUserAccount, getSubCount } from '@/api/user';
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
    myLike: Playlist | {};
    myCreate: Playlist[] | [];
    myCollect: Playlist[] | [];
  };
}
interface userActions {
  getUserAccount: () => void;
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
    }),
    actions: {
      async getUserAccount() {
        const data = await getUserAccount();
        if (!data) {
          return;
        }
        const { profile, account } = data;
        getSubCount({ uid: profile.userId }).then(data => {
          if (!data) {
            return;
          }
          const myCollect = data.filter(item => item.userId !== profile.userId);

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
      },
    },
  }
);
