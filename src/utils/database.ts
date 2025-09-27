import Dexie from 'dexie';

const db = new Dexie('FakeCloudMusic');
db.version(1).stores({
  user: 'id',
  playlist: 'id',
  lyric: 'id',
});

export const user = {
  setUser(data: any) {
    return db
      .table('user')
      .put({ id: 1, data, updated_at: new Date().toISOString() });
  },
  getUser() {
    return db.table('user').where('id').equals(1).first();
  },
  /* 获取用户收藏的歌单 */
  getUserPlaylist(uid: string | number) {
    return db.table('user').where('id').equals(uid).first();
  },
  setUserPlaylist(uid: string | number, data: any) {
    return db
      .table('user')
      .put({ id: uid, data, updated_at: new Date().toISOString() });
  },
};

export const playlist = {
  setPlaylist(id: number | string, data: any) {
    return db
      .table('playlist')
      .put({ id, data, updated_at: new Date().toISOString() });
  },
  getPlaylist(id: string | number) {
    return db.table('playlist').where('id').equals(id).first();
  },
};

export const lyric = {
  setLyric(id: number | string, data: any) {
    return db
      .table('lyric')
      .put({ id, data, updated_at: new Date().toISOString() });
  },
  getLyric(id: string | number) {
    return db.table('lyric').where('id').equals(id).first();
  },
};
