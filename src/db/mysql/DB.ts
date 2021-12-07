/**
 * 数据库操作类
 */
import moment from 'moment';
import { TableNames } from '../../../types/tables';
import { DBTableCol, DBTable } from '../interface';
import mysql from 'mysql';
import {
  DB_TABLE_MAP,
  REGS,
  runSql,
  mysqlConfig,
} from './config';

interface DBConfig<T> {
  includeFields?: (keyof T)[];
  insertDataValidator?: (data: Partial<T>) => void | Partial<T>;
}
interface SearchParams<T> {
  all?: number;
  pageSize: number;
  pageNumber: number;
  orderBy?: keyof T;
  order?: 'asc' | 'desc';
}

export class DB<T extends {}> {
  // 数据库表名
  readonly tableName: TableNames;
  // 数据库字段 map
  private readonly tableColumns: Record<string, DBTableCol>;
  // 数据库配置
  private readonly tableConfig: DBTable;
  // 数据库 json 字段
  private readonly jsonColumnsSet: Set<string>;
  // 数据库连接
  private cnt: mysql.Connection | null = null;
  // 数据库字段返回包含的字段，优先级大于 tableExcludeFields
  private tableIncludeFields: Set<keyof T>;
  // 数据库字段返回需要过滤的字段
  private tableExcludeFields: Set<keyof T>;
  // 对插入数据进行校验并处理
  private insertDataValidator: DBConfig<T>['insertDataValidator'];

  constructor(tableName: TableNames, config?: DBConfig<T>) {
    this.tableName = tableName;
    this.tableColumns = DB_TABLE_MAP[tableName].map;
    this.tableConfig = DB_TABLE_MAP[tableName].config;
    // 构造 json 字段 map
    this.jsonColumnsSet = new Set(Object.keys(this.tableColumns).filter((key) => REGS.json.test(this.tableColumns[key].type)));
    // map 中添加 join 的 json 字段
    if(this.tableConfig.join_json_array) {
      Object.keys(this.tableConfig.join_json_array).forEach(k => this.jsonColumnsSet.add(k));
    }
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
        temp[k] = this.transferFieldValue(col, v, k);
      }
    });
    return temp;
  }
  // 值处理
  transferFieldValue(col: DBTableCol, v: any, k: string) {
    const { type } = col;
    let res: any = '';
    if(REGS.datetime.test(type)) {
      res = `DATE_FORMAT('${v}','%Y-%m-%d %H:%i:%s')`;
    } else if(REGS.date.test(type)) {
      res = `DATE_FORMAT('${v}','%Y-%m-%d')`;
    } else if(REGS.json.test(type)) {
      // JSON 类型
      // 具体 JSON 类型
      if(col.json_type === 'string-array' && v?.some(it => typeof it !== 'string')) {
        throw new Error(`${k}: must be a string array`);
      }
      if(col.json_type === 'object-array' && v?.some(it => typeof it !== 'object')) {
        throw new Error(`${k}: must be a object array`);
      }
      res = `'${JSON.stringify(v)}'`;
    } else {
      res = `'${REGS.number.test(type) ? Number(v) : v}'`;
    }
    return res;
  }

  // 插入
  async insert(datas: Partial<T> | Partial<T>[]) {

    if(!Array.isArray(datas)) datas = [datas];

    const sql = datas.map((data) => {
      // 插入数据进行校验
      const tempData = this.insertDataValidator?.(data);
      if(tempData) {
        data = tempData;
      }

      const filteredData = this.filterField(data, true);
      // 设置默认值
      Object.entries(this.tableColumns).forEach(([k, v]) => {
        if(filteredData[k] === void 0 && v.create_default !== void 0) {
          const dv = typeof v.create_default === 'function' ? v.create_default() : v.create_default;
          filteredData[k] = this.transferFieldValue(v, dv, k);
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
      const sql = `INSERT INTO \`${this.tableName}\`(${keys.join(',')}) VALUES(${values.join(',')})`;
      return sql;
    }).join(';');

    if(!sql) return;

    const res = await this.runSql(sql);
    return res;
  }

  // 更新
  async update(id: string, data: Partial<T>) {

    const filteredData = this.filterField(data, false);
    const kvs: string[] = [];
    Object.entries(filteredData).forEach(([k, v]) => {
      if(v !== void 0) {
        kvs.push(`\`${k}\`=${v}`);
      }
    });

    const sql = `UPDATE \`${this.tableName}\` SET ${kvs.join(',')} WHERE id='${id}'`;
    const res = await this.runSql(sql);
    return res;
  }

  // 删除
  async delete(id: string) {
    const sql = `DELETE FROM \`${this.tableName}\` WHERE id='${id}'`;
    const res = await this.runSql(sql);
    return res;
  }

  // 软删除
  async softDelete(id: string) {
    const sql = `UPDATE \`${this.tableName}\` SET \`is_delete\`='1' WHERE id='${id}'`;
    const res = await this.runSql(sql);
    return res;
  }

  // 查询格式化
  formatField(list: string[], tableName?: string) {
    // join 语句
    const joins: string[] = [];

    // 最后查询结果的字段
    const fields: string[] = [];

    // 遍历
    list.forEach(it => {
      // 字段配置
      const col = this.tableColumns[it];

      // 格式化日期数据的查询结果
      const fieldName = !tableName ? `\`${it}\`` : `a.\`${it}\``;
      let finalFieldName: string;
      if(REGS.datetime.test(col.type)) {
        finalFieldName = `DATE_FORMAT(${fieldName},'%Y-%m-%d %H:%i:%s') AS \`${it}\``;
      } else if(REGS.date.test(col.type)) {
        finalFieldName = `DATE_FORMAT(${fieldName},'%Y-%m-%d') AS \`${it}\``;
      } else {
        finalFieldName = `${fieldName}`;
      }
      fields.push(finalFieldName);

      // 是否 join
      if(col.join_table && tableName) {
        const { table: jt, type, fieldsMap, joinedField: jf } = col.join_table;
        const joinSql = `${type} JOIN \`${jt}\` AS b ON a.\`${it}\`=b.\`${jf ?? 'id'}\``;
        joins.push(joinSql);
        Object.entries(fieldsMap).forEach(([key, val]) => {
          fields.push(`b.\`${key}\` AS \`${val}\``);
        });
      }
    });

    return [fields, joins];
  }
  // 处理查询条件
  resolveFilters(filters: Record<string, string | string[]>) {
    const res: string[] = [];
    Object.entries(filters).forEach(([key, val]) => {
      // 判断是否是 range 类型的查询条件
      const isRange = REGS.range.test(key);
      const isStart = REGS.rangeStart.test(key);
      if(isRange) {
        key = key.replace(REGS.range, '');
      }

      const col = this.tableColumns[key];
      if(col) {
        // 构造成数组
        const valList: string[] = Array.isArray(val) ? val : [val];

        const filter = valList.map(v => {
          // 格式化 key
          key = `a.\`${key}\``;

          // 范围类型
          if(isRange) {
            // 判断是否是日期类型
            if(REGS.date.test(col.type) || REGS.datetime.test(col.type)) {
              v = `DATE_FORMAT('${v}','%Y-%m-%d %H:%i:%s')`;
            } else {
              v = `'${v}'`;
            }

            if(isStart) return `${key}>=${v}`;
            return `${key}<=${v}`;
          }

          if(REGS.number.test(col.type)) {
            return `${key}='${v}'`;
          } else {
            v = v.replaceAll('\\', '\\\\').replaceAll(/(_|%|')/g, (s) => `\\${s}`);
            return `${key} LIKE '%${v}%'`;
          }
        }).join(' OR ');
        res.push(filter);
      }
    });
    return res;
  }
  // 查询
  async search(
    // 通用查询参数
    params: SearchParams<T>,
    // 查询条件
    filter?: string[],
    // 其他条件
    other?: {
      filterDeleted?: boolean; // 是否过滤软删除的数据
      filterJoinJson?: boolean; // 是否过滤 join 查询的数据
    }
  ) {
    const [fields, joins] = (() => {
      let formatList: string[] = [];
      if(this.tableIncludeFields) {
        // 只包含
        formatList = Array.from(this.tableIncludeFields) as string[];
      } else {
        // 排除
        formatList = Object.keys(this.tableColumns).filter((key: any) => this.tableExcludeFields ? !this.tableExcludeFields.has(key) : true);
      }
      return this.formatField(formatList, this.tableName);
    })();

    // 是否有需要 Join 的 json 字段
    const hasJoinJson = !other?.filterJoinJson && !!this.tableConfig.join_json_array;
    const joinRes = {
      fields: [],
      joinMiddle: '',
      joinTarget: '',
      groupBy: '',
    };
    // 是否 join json
    if(hasJoinJson) {
      const record = this.tableConfig.join_json_array;
      Object.entries(record).forEach(([key, val]) => {
        // 构造 json_object
        const kvs: string[] = [];
        // 需要查询的目标表字段
        let fieldsMap: Record<string, string> = {};
        if(val.fieldsMap) {
          fieldsMap = val.fieldsMap;
        } else {
          // 获取目标表的全部字段配置
          const targetTableConfig = DB_TABLE_MAP[val.targetTableName];
          targetTableConfig.config.columns.forEach(col => {
            fieldsMap[col.key] = col.key;
          });
        }
        Object.entries(fieldsMap).forEach(([k, v]) => {
          kvs.push(`'${v}'`, `y.\`${k}\``);
        });

        const field = `CONCAT('[', GROUP_CONCAT(JSON_OBJECT(${kvs.join(',')})), ']') as ${key} `;
        joinRes.fields.push(field);

        // 构造 join 表
        const mainPrimaryField = val.mainTablePrimaryField ?? 'id';
        const targetPrimaryField = val.targetTablePrimaryField ?? 'id';

        joinRes.joinMiddle = `LEFT JOIN ${val.middleTableName} as x ON a.\`${mainPrimaryField}\`=x.\`${val.middleMainField}\``;
        joinRes.joinTarget = `LEFT JOIN ${val.targetTableName} as y ON x.\`${val.middleTargetField}\`=y.\`${targetPrimaryField}\``;
        joinRes.groupBy = `GROUP BY a.\`${mainPrimaryField}\``;
      });
    }

    // sql
    fields.push(...joinRes.fields);
    const sqls = [`SELECT SQL_CALC_FOUND_ROWS ${fields.join(',')} FROM \`${this.tableName}\` AS a `];
    // join
    sqls.push(...joins);
    // join json 字段
    if(hasJoinJson) {
      sqls.push(joinRes.joinMiddle, joinRes.joinTarget);
    }
    // 查询条件
    if(other?.filterDeleted) {
      // 过滤软删除的数据
      if(filter) {
        filter.push('`is_delete`=\'1\'');
      } else {
        filter = ['`is_delete`=\'1\''];
      }
    }
    if(filter?.length) {
      sqls.push(`WHERE ${(filter ?? []).join(' AND ')}`);
    }
    if(hasJoinJson) {
      sqls.push(joinRes.groupBy);
    }
    // 排序
    if(params.orderBy && params.order) {
      sqls.push(`ORDER BY \`${params.orderBy}\` ${params.order}`);
    } else {
      sqls.push('ORDER BY `created_time` desc');
    }
    // 分页
    if(!params.all) {
      const offset: number = (params.pageNumber - 1) * params.pageSize;
      sqls.push(`LIMIT ${params.pageSize} OFFSET ${offset}`);
    }

    const res = await this.runSql(sqls.join(' ') + ';SELECT FOUND_ROWS() AS `total`;');
    const json = JSON.parse(JSON.stringify(res));
    const list = json[0] as {}[];

    // 处理 json 类型
    if(this.jsonColumnsSet.size) {
      list.forEach(li => {
        Array.from(this.jsonColumnsSet.keys()).forEach((key) => {
          li[key] = JSON.parse(li[key]);
        });
      });
    }

    return {
      list,
      total: json[1][0].total,
    };
  }

  // 根据 id 查询
  async detail(id: string) {
    return (await this.search({ pageNumber: 1, pageSize: 1 }, [`a.\`id\`='${id}'`])).list?.[0];
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
      if(REGS.datetime.test(v.type)) {
        data[k] = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      } else if(REGS.time.test(v.type)) {
        data[k] = moment(new Date()).format('HH:mm:ss');
      } else if(REGS.date.test(v.type)) {
        data[k] = moment(new Date()).format('YYYY-MM-DD');
      } else if(REGS.number.test(v.type)) {
        data[k] = 1;
      } else {
        data[k] = 'test';
      }
    });
    return await this.insert(Array(n).fill(data));
  }

  async runSql(sql: string) {
    await this.createConnection();
    const res = await runSql(this.cnt, sql);
    this.closeConnection();
    return res;
  }
}
