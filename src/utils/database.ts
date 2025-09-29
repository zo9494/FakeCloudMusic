import dayjs from 'dayjs';
import Dexie from 'dexie';

const db = new Dexie('FakeCloudMusic');
db.version(1).stores({
  user: 'id',
  playlist: 'id',
  lyric: 'id',
});

interface DataBase {
  id: number | string;
  data: any;
  updated_at: string;
}

abstract class DbTableBase {
  abstract tableName: string;
  abstract db: Dexie;
  async add(id: string | number, data: any) {
    const bool = await this.isExist(id);
    if (bool) {
      this.update(id, data);
    }
    return this.db
      .table(this.tableName)
      .put({ id, data, updated_at: new Date().toISOString() });
  }
  update(id: string | number, data: any) {
    this.db.table(this.tableName).update(id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  }
  findById(id: string | number): Promise<DataBase | undefined> {
    return this.db.table(this.tableName).where('id').equals(id).first();
  }
  async isExist(id: string | number): Promise<boolean> {
    const res = await this.db
      .table(this.tableName)
      .where('id')
      .equals(id)
      .first();
    return res != null;
  }
  // 是否过期
  isExpired(updated_at?: string): boolean {
    if (!updated_at) return true;
    return dayjs(updated_at).add(1, 'hour') > dayjs();
  }
}
class DbTable implements DbTableBase {
  tableName: string;
  db: Dexie;
  constructor(tableName: string, db: Dexie) {
    this.tableName = tableName;
    this.db = db;
  }

  findById(id: string | number): Promise<DataBase | undefined> {
    return this.db.table(this.tableName).where('id').equals(id).first();
  }
  async add(id: string | number, data: any) {
    const bool = await this.isExist(id);
    if (bool) {
      this.update(id, data);
    }
    return this.db
      .table(this.tableName)
      .put({ id, data, updated_at: new Date().toISOString() });
  }
  update(id: string | number, data: any) {
    this.db.table(this.tableName).update(id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  }
  // 数据是否存在
  async isExist(id: string | number) {
    const res = await this.db
      .table(this.tableName)
      .where('id')
      .equals(id)
      .first();
    return res != null;
  }
  // 是否过期
  isExpired(updated_at?: string): boolean {
    if (!updated_at) return true;
    return dayjs(updated_at).add(1, 'hour') < dayjs();
  }
}

export const lyric = new DbTable('lyric', db);
export const playlist = new DbTable('playlist', db);
export const user = new DbTable('user', db);
