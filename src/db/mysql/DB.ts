/**
 * 数据库操作类
 */
import moment from 'moment';
import { TableNames } from '~types/tables';
import { CommonTable } from '~types/tables/Common';
import { DBTableCol, DBTable, JoinJsonConfig } from '../interface';
import mysql from 'mysql';
import {
  DB_TABLE_MAP,
  REGS,
  runSql,
  mysqlConfig,
} from './config';
import { transferNumber2Char } from './util';

interface DBConfig<T> {
  includeFields?: (keyof T)[];
  insertDataValidator?: (data: Partial<T>) => void | Partial<T>;
}
interface SearchParams<T> {
  all?: number;
  pageSize?: number;
  pageNumber?: number;
  orderBy?: keyof T;
  order?: 'asc' | 'desc';
}
type MiddleData = { data: number[], config: JoinJsonConfig };

// 每张表的默认主键
const PRIMARY_FIELD = 'id';
export class DB<T extends CommonTable> {
  // 当前数据库表名
  readonly _tableName: TableNames;
  // 数据库当前使用的表名
  private _currentTableName: TableNames | null = null;
  // 数据库 json 字段
  private readonly jsonColumnsSet: Set<string>;
  // 数据库连接
  private cnt: mysql.Connection | null = null;
  // 数据库字段返回包含的字段，优先级大于 tableExcludeFields
  private tableIncludeFields: Set<keyof T> | null = null;
  // 数据库字段返回需要过滤的字段
  private tableExcludeFields: Set<keyof T> | null = null;
  // 对插入数据进行校验并处理
  private insertDataValidator: DBConfig<T>['insertDataValidator'];

  // 数据库当前操作的表名
  get tableName() {
    return this._currentTableName ?? this._tableName;
  }
  // 数据库字段 map
  get tableColumns() {
    return DB_TABLE_MAP[this.tableName].map;
  }
  // 数据库配置
  get tableConfig() {
    return DB_TABLE_MAP[this.tableName].config;
  }

  constructor(tableName: TableNames, config?: DBConfig<T>) {
    this._tableName = tableName;
    // 构造本表 json 字段 map
    this.jsonColumnsSet = new Set(Object.keys(this.tableColumns).filter((key) => REGS.json.test(this.tableColumns[key].type)));
    // map 中添加 join 的 json 字段
    if(this.tableConfig.join_json_array) {
      Object.keys(this.tableConfig.join_json_array).forEach(k => this.jsonColumnsSet.add(k));
    }
    this.setIncludeFields(config?.includeFields);
  }

  // 设置当前使用的表名
  setCurrentTable(table: TableNames) {
    this._currentTableName = table;
  }
  // 清除当前设置的表名
  clearCurrentTable() {
    this._currentTableName = null;
  }

  // 设置数据库包含的查询字段
  setIncludeFields(fields?: (keyof T)[]) {
    this.tableIncludeFields = fields ? new Set(fields) : null;
  }
  // 设置数据库排除的查询字段
  setExcludeFields(fields?: (keyof T)[]) {
    this.tableExcludeFields = fields ? new Set(fields) : null;
  }

  /* start 更新关联关系表 */
  // id: 当前表的 id
  async updateMiddleTable(id: number | string, mds: MiddleData[], isInsert: boolean) {
    // 插入时切无关联关系，则不需要处理
    if(isInsert && !mds.length) return;

    // 非新增，先删除所有已有的关联关系
    if(!isInsert) {
      await this.deleteMiddleTable(id, mds);
    }

    // 再添加新的关联关系
    await this.insertMiddleTable(id, mds);
  }
  // 新增
  async insertMiddleTable(id: number | string, mds: MiddleData[]) {
    for(const md of mds) {
      this.setCurrentTable(md.config.middleTableName);
      const datas = md.data.map(tid => ({
        [md.config.middleMainField]: id,
        [md.config.middleTargetField]: tid,
      }));
      await this.insert(datas as unknown as Partial<T>[]);
      this.clearCurrentTable();
    }
  }
  // 删除
  async deleteMiddleTable(id: number | string, mds: MiddleData[]) {
    for(const md of mds) {
      this.setCurrentTable(md.config.middleTableName);
      await this.deleteBy(this.resolveFilters({
        [md.config.middleMainField]: `${id}`,
      }, { type: 'equal', hasPrefix: false }).resolved);
      this.clearCurrentTable();
    }
  }
  /* end 更新关联关系表 */

  // 数据字段处理
  filterField(params: Partial<T>, isInsert: boolean, force: boolean) {
    // 过滤后的数据
    const temp: Partial<T> = {};
    // 需要进行中间表处理的数据及其配置
    const middleDatas: MiddleData[] = [];

    if(!isInsert) {
      // 更新修改时间
      params.last_modified_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    }

    // 过滤数据库中存在的字段
    Object.entries(params).forEach(([k, v]) => {
      const col = this.tableColumns[k];
      // 数据库存在 && 非主键 && 创建时 或 更新时且只读
      if(
        col &&
        !col.primary_key &&
        (
          force ||
          (!col.forbid_write && (!col.write_only_insert || isInsert))
        )
      ) {
        temp[k] = this.transferFieldValue(col, v, k);
      }

      // 通过中间表增加关联
      const jsonConfig = this.tableConfig?.join_json_array?.[k];
      if(jsonConfig) {
        middleDatas.push({
          data: v as number[], // 需要增加关联关系的目标表 id 列表
          config: jsonConfig, // 配置项
        });
      }
    });
    return { filteredData: temp, middleDatas };
  }
  // 值处理
  transferFieldValue(col: DBTableCol, v: any, k: string) {
    const { type } = col;
    let res: any = '';
    if(REGS.datetime.test(type)) {
      res = v ? `DATE_FORMAT('${v}','%Y-%m-%d %H:%i:%s')` : null;
    } else if(REGS.date.test(type)) {
      res = v ? `DATE_FORMAT('${v}','%Y-%m-%d')` : null;
    } else if(REGS.json.test(type)) {
      // JSON 类型
      // 具体 JSON 类型
      if(col.json_type === 'string-array' && v?.some(it => typeof it !== 'string')) {
        throw new Error(`${k}: must be a string array`);
      }
      if(col.json_type === 'object-array' && v?.some(it => typeof it !== 'object')) {
        throw new Error(`${k}: must be a object array`);
      }
      if(col.json_type === 'number-array' && v?.some(it => typeof it !== 'number')) {
        throw new Error(`${k}: must be a number array`);
      }
      res = `'${JSON.stringify(v)}'`;
    } else {
      res = `'${REGS.number.test(type) ? Number(v) : v}'`;
    }
    return res;
  }

  // 插入
  async insert(datas: Partial<T> | Partial<T>[], force = false) {
    if(!Array.isArray(datas)) datas = [datas];
    // 关联关系数组
    const middleDatasList: MiddleData[][] = [];

    const sql = datas.map((data) => {
      // 插入数据进行校验
      const tempData = this.insertDataValidator?.(data);
      if(tempData) {
        data = tempData;
      }

      const { filteredData, middleDatas } = this.filterField(data, true, force);
      middleDatasList.push(middleDatas);
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
    if(res.length) {
      // 插入多个
      for(let i = 0; i < middleDatasList.length; i++) {
        await this.updateMiddleTable(res[i].insertId, middleDatasList[i], true);
      }
    } else {
      // 插入单个
      await this.updateMiddleTable(res.insertId, middleDatasList[0], true);
    }
    return res;
  }

  // 写保护
  async writeGuard(id: string, force: boolean) {
    const res = await this.detail(id);
    if(!res) {
      throw new Error('数据不存在');
    } else if(res.is_system && !force) {
      throw new Error('系统创建的数据不能修改或删除');
    }
  }

  // 更新
  async update<R = Partial<T>>(id: string | number, data: R, opts?: {
    force?: boolean;
  }) {
    await this.writeGuard(id as string, opts?.force);

    const { filteredData, middleDatas } = this.filterField(data, false, opts?.force);
    const kvs: string[] = [];
    Object.entries(filteredData).forEach(([k, v]) => {
      if(v !== void 0) {
        kvs.push(`\`${k}\`=${v}`);
      }
    });

    const sql = `UPDATE \`${this.tableName}\` SET ${kvs.join(',')} WHERE \`${PRIMARY_FIELD}\`='${id}'`;
    const res = await this.runSql(sql);
    await this.updateMiddleTable(id, middleDatas, false);
    return res;
  }

  // 删除
  async delete(
    // 要删除的 id
    id: string | number | (string | number)[],
    opts?: {
      idKey?: string; // 要删除的 id 对应的字段，默认为 "id"
      fullDelete?: boolean; // 是否完全删除，包括关联的中间表
    },
    outFilters?: string[],
  ) {
    await this.writeGuard(id as string, false);

    const { idKey = PRIMARY_FIELD, fullDelete } = opts ?? {};

    // 过滤条件
    const filters: string[] = [...(outFilters ?? [])];
    if(Array.isArray(id)) {
      const ids = id.map(it => `'${it}'`).join(',');
      filters.push(`\`${idKey}\` IN (${ids})`);
    } else {
      filters.push(`\`${idKey}\`='${id}'`);
    }

    const sql = `DELETE FROM \`${this.tableName}\` WHERE ${filters.join(' AND ')}`;
    const res = await this.runSql(sql);

    // 删除中间表的关联关系
    if(fullDelete && this.tableConfig.join_json_array) {
      const idList = Array.isArray(id) ? id : [id];
      for(const i of idList) {
        await this.deleteMiddleTable(
          i,
          Object.values(this.tableConfig.join_json_array).map(it => ({ data: [], config: it }))
        );
      }
    }

    return res;
  }

  // 条件删除
  async deleteBy(outFilters: string[]) {
    const filters: string[] = [...(outFilters ?? [])];
    const sql = `DELETE FROM \`${this.tableName}\` WHERE ${filters.join(' AND ')}`;
    const res = await this.runSql(sql);
    return res;
  }

  // 软删除
  async softDelete(id: string, filters?: string[]) {
    // 过滤条件
    const filterString: string = filters?.length ? ` ${filters.join(' AND ')}` : '';

    const sql = `UPDATE \`${this.tableName}\` SET \`is_delete\`='1' WHERE \`${PRIMARY_FIELD}\`='${id}'${filterString}`;
    const res = await this.runSql(sql);
    return res;
  }

  // 查询格式化
  formatField(list: string[], tableName?: string): [string[], string[], Record<string, { key: string; tableAlias: string; }>] {
    // join 语句
    const joins: string[] = [];

    // 最后查询结果的字段
    const fields: string[] = [];

    // join 字段反向查询 map
    const reverseMap: Record<string, { key: string; tableAlias: string; }> = {};

    const joinedCount = { value: 1 }; // join table 的计数器
    // 遍历
    list.forEach((it, index) => {
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
        this.recursiveJoin({
          currentField: it,
          currentTableAlias: 'a',
          col,
          joins,
          fields,
          reverseMap,
          joinedCount,
        });
      }
    });

    return [fields, joins, reverseMap];
  }

  // 递归处理 join
  recursiveJoin(
    params: {
      currentField: string; // 用来 join 的当前表 field
      currentTableAlias: string; // 当前表别名
      col: DBTableCol; // 列配置
      joins: string[]; // join 的 sql 数组
      fields: string[]; // sql 选择的 field
      reverseMap: Record<string, { key: string; tableAlias: string; }>; // 用来处理 join 表的字段查询
      joinedCount: {value: number}; // join 的计数，用来转换成表别名
    }
  ) {
    const { currentField, currentTableAlias, col, joins, fields, reverseMap, joinedCount } = params;
    // 被 join 表的别名
    const joinTableAlias = transferNumber2Char(joinedCount.value++);
    const { table: jt, type, fieldsMap, joinedField: jf } = col.join_table;


    const joinSql = `${type} JOIN \`${jt}\` AS ${joinTableAlias} ON ${currentTableAlias}.\`${currentField}\`=${joinTableAlias}.\`${jf ?? PRIMARY_FIELD}\``;
    joins.push(joinSql);
    Object.entries(fieldsMap).forEach(([key, val]) => {
      reverseMap[val] = {
        key,
        tableAlias: joinTableAlias,
      };
      fields.push(`${joinTableAlias}.\`${key}\` AS \`${val}\``);
    });

    const targetTableConfigMap = DB_TABLE_MAP[jt].map;
    if(targetTableConfigMap) {
      // 递归调用
      Object.entries(targetTableConfigMap).forEach(([key, val]) => {
        if(val.join_table) {
          this.recursiveJoin({
            currentField: key,
            currentTableAlias: joinTableAlias,
            col: val,
            joins,
            fields,
            reverseMap,
            joinedCount,
          });
        }
      });
    }
  }

  // 处理查询条件
  resolveFilters(
    filters: Record<string, string | string[]>,
    opts?: {
      // 查询类型
      type?: 'auto' | 'equal' | 'like';
      // 是否需要 prefix 默认 "a."
      hasPrefix?: boolean;
    },
  ) {
    const { type = 'equal', hasPrefix = true } = opts ?? {};
    const res: string[] = [];
    const unmatchedFilters: Record<string, any> = {};

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
        const valList: string[] = (Array.isArray(val) ? val : [val]);

        const filter = valList.map(v => {
          // 格式化 key
          const realKey = `${hasPrefix ? 'a.' : ''}\`${key}\``;

          // 范围类型
          if(isRange) {
            // 判断是否是日期类型
            if(REGS.date.test(col.type) || REGS.datetime.test(col.type)) {
              v = `DATE_FORMAT('${v}','%Y-%m-%d %H:%i:%s')`;
            } else {
              v = `'${v}'`;
            }

            if(isStart) return `${realKey}>=${v}`;
            return `${realKey}<=${v}`;
          }

          if(REGS.number.test(col.type)) {
            return `${realKey}='${v}'`;
          } else {
            if(type === 'equal') {
              return `${realKey}=BINARY '${v}'`;
            } else {
              v = v.replaceAll('\\', '\\\\').replaceAll(/(_|%|')/g, (s) => `\\${s}`);
              return `${realKey} LIKE '%${v}%'`;
            }
          }
        }).join(' OR ');
        res.push(filter);
      } else {
        unmatchedFilters[key] = val;
      }
    });
    return {
      resolved: res,
      unresolved: unmatchedFilters,
    };
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
      unresolvedFilter?: Record<string, any>; // 未处理过的筛选条件
    }
  ) {
    const [fields, joins, reverseMap] = (() => {
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

        const field = `CONCAT('[', GROUP_CONCAT(IF(y.\`${PRIMARY_FIELD}\` IS NULL, '', JSON_OBJECT(${kvs.join(',')}))), ']') AS \`${key}\``;
        joinRes.fields.push(field);

        // 构造 join 表
        const mainPrimaryField = val.mainTablePrimaryField ?? PRIMARY_FIELD;
        const targetPrimaryField = val.targetTablePrimaryField ?? PRIMARY_FIELD;

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
        filter.push('a.`is_delete`=\'0\'');
      } else {
        filter = ['a.`is_delete`=\'0\''];
      }
    }
    // 插入额外查询条件
    if(filter?.length || other?.unresolvedFilter) {
      const fls = [
        ...(filter ?? []),
      ];
      // 过滤 join 表的字段
      if(other?.unresolvedFilter) {
        Object.entries(other.unresolvedFilter).forEach(([key, val]) => {
          const opt = reverseMap[key];
          if(opt) {
            fls.push(`${opt.tableAlias}.\`${opt.key}\`='${val}'`);
          }
        });
      }
      sqls.push(`WHERE ${fls.join(' AND ')}`);
    }
    if(hasJoinJson) {
      sqls.push(joinRes.groupBy);
    }
    // 排序
    if(params.orderBy && params.order) {
      sqls.push(`ORDER BY \`is_system\` desc, \`${params.orderBy}\` ${params.order}`);
    } else {
      sqls.push('ORDER BY `is_system` desc, `created_time` desc');
    }
    // 分页
    if(!params.all) {
      const offset: number = (params.pageNumber - 1) * params.pageSize;
      sqls.push(`LIMIT ${params.pageSize} OFFSET ${offset}`);
    }
    const fullsql = sqls.join(' ') + ';SELECT FOUND_ROWS() AS `total`;';
    const res = await this.runSql(fullsql);
    const json = JSON.parse(JSON.stringify(res));
    const list = json[0] as T[];

    // 处理 json 类型
    if(this.jsonColumnsSet.size) {
      list.forEach(li => {
        Array.from(this.jsonColumnsSet.keys()).forEach((key) => {
          if(li[key]) {
            li[key] = JSON.parse(li[key]);
          }
        });
      });
    }

    return {
      list,
      total: json[1][0].total as number,
    };
  }

  // 根据 id 查询
  async detail(id: string, filters?: string[]) {
    const res = (await this.search(
      { pageNumber: 1, pageSize: 1 },
      [
        `a.\`${PRIMARY_FIELD}\`='${id}'`,
        ...(filters ?? []),
      ]
    ));
    return res.list?.[0];
  }

  // 查询总数
  async count(filters?: string[]) {
    const sql = `SELECT COUNT(*) as total FROM ${this.tableName}` +
      (filters
        ? ` WHERE ${filters.join(' AND ')}`
        : '');

    const res = await this.runSql(sql);
    return res[0].total as number;
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
    n = Math.max(Math.floor(n), 1);
    const dataList: {}[] = [];
    for(let i = 0; i < n; i++) {
      const data = {};
      Object.entries(this.tableColumns).forEach(([k, v]) => {
        if(REGS.datetime.test(v.type)) {
          data[k] = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        } else if(REGS.time.test(v.type)) {
          data[k] = moment(new Date()).format('HH:mm:ss');
        } else if(REGS.date.test(v.type)) {
          data[k] = moment(new Date()).format('YYYY-MM-DD');
        } else if(REGS.boolNumber.test(v.type)) {
          data[k] = Math.random() > 0.5 ? 1 : 0;
        } else if(REGS.number.test(v.type)) {
          data[k] = Math.floor(Math.random() * 10 + 1);
        } else if(REGS.json.test(v.type)) {
          data[k] = null;
        } else {
          data[k] = 'test';
        }
      });
      dataList.push(data);
    }
    return await this.insert(dataList);
  }

  async runSql(sql: string) {
    await this.createConnection();
    const res = await runSql(this.cnt, sql);
    this.closeConnection();
    return res;
  }
}
