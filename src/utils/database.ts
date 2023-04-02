import Dexie from 'dexie';

export class DataBase {
  db: Dexie;
  constructor(name: string, ...tables: Table[]) {
    this.db = new Dexie(name);
    this.init(tables);
  }
  private init(tables: Table[], ver = 1) {
    const stores: { [propName: string]: string } = {};
    tables.forEach(item => {
      item.setDb(this.db);
      stores[item.table.name] = item.table.index;
    });
    console.log(stores);

    this.db.version(ver).stores(stores);
  }
}
abstract class Table {
  abstract table: {
    name: string;
    index: string;
  };
  db?: Dexie;
  setDb(db: Dexie) {
    this.db = db;
  }
  add(val: any) {
    this.db?.table(this.table.name).put(val);
  }
}
class LikeTable extends Table {
  table = { name: 'like', index: '++index,id' };
  constructor() {
    super();
  }
}
export const likeTable = new LikeTable();
export const CreateDataBase = (() => {
  let instance: DataBase | undefined;
  return () => {
    if (instance) {
      return instance;
    }
    instance = new DataBase('FakeCloudMusic', likeTable);
    return instance;
  };
})();

export const db = CreateDataBase();
