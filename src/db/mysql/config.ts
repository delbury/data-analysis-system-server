import mysql, { ConnectionConfig } from 'mysql';
import keyBy from 'lodash/keyBy';
import { DBTable, DBTableCol } from '../interface';
import { TableNames } from '~types/tables';

// 表配置
import workbenchTable from '../tables/workbench_table';
import teamGroupTable from '../tables/team_group_table';
import staffTable from '../tables/staff_table';
import roleTable from '../tables/role_table';
import accountTable from '../tables/account_table';
import permissionTable from '../tables/permission_table';
import middleRolePermission from '../tables/middle_role_permission_table';
import middleAccountRole from '../tables/middle_account_role_table';

// 范围类型查询条件的前缀
export const REGS = {
  range: /^_(start|end)_/,
  rangeStart: /^_start_/,
  rangeEnd: /^_end_/,
  date: /^DATE/i,
  datetime: /^DATETIME/i,
  time: /^TIME/i,
  number: /^(DECIMAL|INT|TINYINT)/i,
  json: /^JSON/i,
  boolNumber: /^TINYINT/i,
};

// 数据库 table 列参数 map
const getMap = (table: DBTable) => ({ config: table, map: keyBy(table.columns, (col) => col.key) });
export const DB_TABLE_MAP: { [key in TableNames]: { config: DBTable, map: Record<string, DBTableCol>}} = {
  workbench: getMap(workbenchTable),
  team_group: getMap(teamGroupTable),
  staff: getMap(staffTable),
  role: getMap(roleTable),
  account: getMap(accountTable),
  permission: getMap(permissionTable),
  middle_role_permission: getMap(middleRolePermission),
  middle_account_role: getMap(middleAccountRole),
};

export const mysqlConfig: ConnectionConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  port: Number(process.env.MYSQL_PORT),
  database: process.env.MYSQL_DATABASE,
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

      // 约束条件
      const unique = tableConfig.unique?.length ?
        `,UNIQUE(${tableConfig.unique.map(field => `\`${field}\``).join(',')})` :
        '';

      const sql = [
        `DROP TABLE IF EXISTS \`${tableConfig.name}\``,
        `CREATE TABLE IF NOT EXISTS \`${tableConfig.name}\`(${cols}${unique})`,
      ].join(';');

      const result = await runSql(cnt, sql);
      console.log(`database table: ${tableConfig.name} created !`);

      resolve(result);
    });
  });

};


// 执行 sql
export const runSql = (cnt: mysql.Connection, sql: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cnt.query(sql, (err, result, fields) => {
      if(err) return reject(err);
      resolve(result);
    });
  });
};
