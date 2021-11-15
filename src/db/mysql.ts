import mysql, { ConnectionConfig } from 'mysql';
import { DBTable } from './interface';
import { formatDatetime } from '../utils/tools';
import workbenchTable from './tables/workbench_table';

const mysqlConfig: ConnectionConfig = {
  host: 'localhost',
  user: 'user',
  password: '123456a',
  // port: 3306,
  database: 'data_analysis_system',
};

// 创建数据库连接
const createConnection = (cb?: (cnt: mysql.Connection) => void) => {
  const cnt = mysql.createConnection({
    ...mysqlConfig,
    multipleStatements: true,
  });
  cnt.connect(err => {
    if(err) throw err;
    console.log('mysql connected !');
    cb?.(cnt);
    cnt.end();
  });
};

// 执行 sql
const runSql = (cnt: mysql.Connection, sql: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cnt.query(sql, (err, result, fields) => {
      if(err) return reject(err);
      resolve(result);
    });
  });
};

// 创建数据库
const createDatabase = async (cnt: mysql.Connection) => {
  const sql = `CREATE DATABASE ${mysqlConfig.database}`;
  await runSql(cnt, sql);
  console.log('create database success !');
};

// 创建表
const createTable = async (cnt: mysql.Connection, tableConfig: DBTable) => {
  // 生成字段配置
  const cols = tableConfig.columns.map(it => {
    const opts: string[] = [it.key, it.type];
    if(it.not_null) opts.push('NOT NULL');
    if(it.comment !== void 0) opts.push(`COMMENT '${it.comment}'`);
    if(it.auto_increment) opts.push('AUTO_INCREMENT');
    if(it.primary_key) opts.push('PRIMARY KEY');
    if(it.default !== void 0) opts.push('DEFAULT ' + it.default);
    return opts.join(' ');
  }).join(',');

  const sql = [
    `DROP TABLE IF EXISTS ${tableConfig.name}`,
    `CREATE TABLE IF NOT EXISTS ${tableConfig.name}(${cols})`,
  ].join(';');

  const result = await runSql(cnt, sql);
  return result;
};

// 数据库实例
export class DB<T extends object = {}> {
  private readonly table: string;
  private cnt: mysql.Connection | null = null;
  constructor(table: string) {
    this.table = table;
    this.createConnection();
  }
  // 插入
  async insert(data: Partial<T>) {
    if(!this.cnt) return;

    const keys: string[] = [];
    const values: string[] = [];
    Object.entries(data).forEach(([k, v]) => {
      if(v !== void 0) {
        keys.push(k);
        values.push(`'${v}'`);
      }
    });
    console.log(keys, values);
    const sql = `INSERT INTO ${this.table}(${keys.join(',')}) VALUES(${values.join(',')})`;
    const res = await runSql(this.cnt, sql);

    return res;
  }
  // 更新
  async update(id: string, data: Partial<T>) {
    if(!this.cnt) return;

    const kvs: string[] = [];
    Object.entries(data).forEach(([k, v]) => {
      if(v !== void 0) {
        kvs.push(`${k}='${v}'`);
      }
    });
    const sql = `UPDATE ${this.table} SET ${kvs.join(' ')} WHERE id=${id}`;
    const res = await runSql(this.cnt, sql);

    return res;
  }
  // 删除
  async delete(id: string) {
    if(!this.cnt) return;

    const sql = `DELETE FROM ${this.table} WHERE id=${id}`;
    const res = await runSql(this.cnt, sql);

    return res;
  }
  // 查询
  async search() {
    if(!this.cnt) return;

    const sql = `SELECT * FROM ${this.table}`;
    const res = await runSql(this.cnt, sql);

    return res;
  }
  // 创建连接
  createConnection(cb?: () => void) {
    if(!this.cnt) {
      this.cnt = mysql.createConnection({
        ...mysqlConfig,
        multipleStatements: true,
      });

      this.cnt.connect(err => {
        if(err) throw err;
        console.log('mysql connected !');
        cb?.();
        // this.cnt?.end();
      });
    }
  }
  // 关闭连接
  closeConnection() {
    if(this.cnt) {
      this.cnt.end();
      this.cnt = null;
    }
  }
}

const db = new DB('workbench');
export const run = () => {
  // createConnection((cnt) => {
  //   createTable(cnt, workbenchTable);
  // });
  // db.search();
  // db.insert();
  // db.delete('1');
  // db.update('2');
  // db.insert({
  //   unit: '啥都没公司', dept: '居家部', trainer_id: '12345678', created_time: formatDatetime(),
  // });
  db.update('3', { unit: '都哟都有' });
};
