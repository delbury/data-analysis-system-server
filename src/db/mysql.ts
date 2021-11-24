import mysql, { ConnectionConfig } from 'mysql';
import keyBy from 'lodash/keyBy';
import { DBTable, DBTableCol } from './interface';
import { TableNames } from '../../types/tables';
import { numberReg } from '../../libs/common';
import moment from 'moment';

// 表配置
import workbenchTable from './tables/workbench_table';
import teamGroupTable from './tables/team_group_table';
import staffTable from './tables/staff_table';

// 数据库 table 列参数 map
const getMap = (table: DBTable) => keyBy(table.columns, (col) => col.key);
const DB_TABLE_MAP: { [key in TableNames]: Record<string, DBTableCol>} = {
  workbench: getMap(workbenchTable),
  team_group: getMap(teamGroupTable),
  staff: getMap(staffTable),
};

const mysqlConfig: ConnectionConfig = {
  host: 'localhost',
  user: 'user',
  password: '123456a',
  // port: 3306,
  database: 'data_analysis_system',
};

// 创建数据库
export const createDatabase = async (cnt: mysql.Connection) => {
  const sql = `CREATE DATABASE ${mysqlConfig.database}`;
  await runSql(cnt, sql);
  console.log('create database success !');
};

// 创建连接
export const createConnection = (cb?: (cnt: mysql.Connection) => void) => {
  const cnt = mysql.createConnection({
    ...mysqlConfig,
    multipleStatements: true,
  });

  cnt.connect(err => {
    if(err) throw err;

    cb?.(cnt);
    cnt.end();
  });
};

// 创建表
export const createTable = (tableConfig: DBTable) => {
  return new Promise((resolve, reject) => {
    createConnection(async (cnt) => {
      // 生成字段配置
      const cols = tableConfig.columns.map(it => {
        const opts: string[] = [`\`${it.key}\``, it.type];
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
      console.log('database table created !');

      resolve(result);
    });
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

/**
 * 数据库操作类
 */
interface DBConfig<T> {
  includeFields?: (keyof T)[];
}
interface SearchParams<T> {
  pageSize: number;
  pageNumber: number;
  orderBy?: keyof T;
  order?: 'asc' | 'desc';
}
export class DB<T extends {}> {
  // 数据库表名
  private readonly tableName: TableNames;
  // 数据库字段 map
  private readonly tableColumns: Record<string, DBTableCol>;
  // 数据库连接
  private cnt: mysql.Connection | null = null;
  // 数据库字段返回包含的字段，优先级大于 tableExcludeFields
  private tableIncludeFields: Set<keyof T>;
  // 数据库字段返回需要过滤的字段
  private tableExcludeFields: Set<keyof T>;

  constructor(tableName: TableNames, config?: DBConfig<T>) {
    this.tableName = tableName;
    this.tableColumns = DB_TABLE_MAP[tableName];
    this.setIncludeFields(config?.includeFields);
  }

  // 设置数据库查询字段
  setIncludeFields(fields?: (keyof T)[]) {
    this.tableIncludeFields = fields ? new Set(fields) : null;
  }
  setExcludeFields(fields?: (keyof T)[]) {
    this.tableExcludeFields = fields ? new Set(fields) : null;
  }

  // 数据字段处理
  filterField(params: Partial<T>, isInsert: boolean): Partial<T> {
    const temp: Partial<T> = {};
    // 过滤数据库中存在的字段
    Object.entries(params).forEach(([k, v]) => {
      const col = this.tableColumns[k];
      // 数据库存在 && 非主键 && 创建时 或 更新时且只读
      if(
        col &&
        !col.primary_key &&
        !col.forbid_write &&
        (!col.write_only_insert || isInsert)
      ) {
        temp[k] = this.transferFieldValue(col.type, v);
      }
    });
    return temp;
  }
  // 值处理
  transferFieldValue(type: string, v: any) {
    let res: any = '';
    if(/^DATETIME/i.test(type)) {
      res = `DATE_FORMAT('${v}','%Y-%m-%d %H:%i:%s')`;
    } else if(/^DATE/i.test(type)) {
      res = `DATE_FORMAT('${v}','%Y-%m-%d')`;
    } else {
      res = `'${numberReg.test(type) ? Number(v) : v}'`;
    }
    return res;
  }

  // 插入
  async insert(datas: Partial<T> | Partial<T>[]) {
    await this.createConnection();

    if(!Array.isArray(datas)) datas = [datas];

    const sql = datas.map((data) => {
      const filteredData = this.filterField(data, true);
      // 设置默认值
      Object.entries(this.tableColumns).forEach(([k, v]) => {
        if(filteredData[k] === void 0 && v.create_default !== void 0) {
          const dv = typeof v.create_default === 'function' ? v.create_default() : v.create_default;
          filteredData[k] = this.transferFieldValue(v.type, dv);
        }
      });
      const keys: string[] = [];
      const values: string[] = [];
      Object.entries(filteredData).forEach(([k, v]) => {
        if(v !== void 0) {
          keys.push(`\`${k}\``);
          values.push(`${v}`);
        }
      });
      const sql = `INSERT INTO ${this.tableName}(${keys.join(',')}) VALUES(${values.join(',')})`;
      return sql;
    }).join(';');

    const res = await runSql(this.cnt, sql);

    this.closeConnection();
    return res;
  }

  // 更新
  async update(id: string, data: Partial<T>) {
    await this.createConnection();

    const filteredData = this.filterField(data, false);
    const kvs: string[] = [];
    Object.entries(filteredData).forEach(([k, v]) => {
      if(v !== void 0) {
        kvs.push(`\`${k}\`=${v}`);
      }
    });
    const sql = `UPDATE ${this.tableName} SET ${kvs.join(',')} WHERE id='${id}'`;
    const res = await runSql(this.cnt, sql);

    this.closeConnection();
    return res;
  }

  // 删除
  async delete(id: string) {
    await this.createConnection();

    const sql = `DELETE FROM ${this.tableName} WHERE id='${id}'`;
    const res = await runSql(this.cnt, sql);

    this.closeConnection();
    return res;
  }

  // 查询格式化
  formatField(list: string[]) {
    return list.map(it => {
      const col = this.tableColumns[it];
      if(/^DATETIME/i.test(col.type)) {
        return `DATE_FORMAT(\`${it}\`,'%Y-%m-%d %H:%i:%s') as \`${it}\``;
      } else if(/^DATE/i.test(col.type)) {
        return `DATE_FORMAT(\`${it}\`,'%Y-%m-%d') as \`${it}\``;
      }
      return `\`${it}\``;
    });
  }
  // 查询
  async search(params: SearchParams<T>, filter?: string[]) {
    await this.createConnection();

    const fields: string = (() => {
      if(this.tableIncludeFields) {
        // 只包含
        return this.formatField(Array.from(this.tableIncludeFields) as string[]).join(',');
      } else {
        // 排除
        const temp = Object.keys(this.tableColumns).filter((key: any) => this.tableExcludeFields ? !this.tableExcludeFields.has(key) : true);
        return this.formatField(temp).join(',');
      }
    })();

    // sql
    const sqls = [`SELECT SQL_CALC_FOUND_ROWS ${fields} FROM ${this.tableName}`];
    if(filter?.length) {
      sqls.push(`WHERE ${(filter ?? []).join(' AND ')}`);
    }
    // 排序
    if(params.orderBy && params.order) {
      sqls.push(`ORDER BY ${params.orderBy} ${params.order}`);
    } else {
      sqls.push('ORDER BY created_time desc');
    }
    // 分页
    const offset: number = (params.pageNumber - 1) * params.pageSize;
    sqls.push(`LIMIT ${params.pageSize} OFFSET ${offset}`);

    const res = await runSql(this.cnt, sqls.join(' ') + ';SELECT FOUND_ROWS() as total;');
    this.closeConnection();
    return {
      list: res[0],
      total: JSON.parse(JSON.stringify(res[1]))[0].total,
    };
  }

  // 根据 id 查询
  async detail(id: string) {
    return (await this.search({ pageNumber: 1, pageSize: 1 }, [`id=${id}`])).list?.[0];
  }

  // 创建连接
  createConnection(cb?: () => void) {
    return new Promise((resolve, reject) => {
      if(!this.cnt) {
        this.cnt = mysql.createConnection({
          ...mysqlConfig,
          multipleStatements: true,
        });

        this.cnt.connect(err => {
          if(err) reject(err);

          if(cb) {
            cb();
            this.closeConnection();
          }

          resolve(this.cnt);
        });
      } else {
        resolve(this.cnt);
      }
    });
  }

  // 关闭连接
  closeConnection() {
    if(this.cnt) {
      this.cnt.end();
      this.cnt = null;
    }
  }

  // 插入测试数据
  async insertTestData(n = 1) {
    const data = {};
    Object.entries(this.tableColumns).forEach(([k, v]) => {
      if(/^DATETIME/i.test(v.type)) {
        data[k] = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      } else if(/^TIME/i.test(v.type)) {
        data[k] = moment(new Date()).format('HH:mm:ss');
      } else if(/^DATE/i.test(v.type)) {
        data[k] = moment(new Date()).format('YYYY-MM-DD');
      } else if(/^(DECIMAL|INT|TINYINT)/i.test(v.type)) {
        data[k] = 1;
      } else {
        data[k] = 'test';
      }
    });
    return await this.insert(Array(n).fill(data));
  }
}
