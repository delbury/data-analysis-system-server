import { TableNames } from '../../types/tables';

// 表字段配置
export interface DBTableCol {
  // 数据库相关参数
  // 数据库内字段名
  key: string;
  // 数据库内字段类型
  type: string;
  // 注释
  comment?: string;
  // 默认值
  default?: string | number;
  // 是否自增
  auto_increment?: boolean;
  // 是否不允许为空
  not_null?: boolean;
  // 是否是主键
  primary_key?: boolean;

  // 字段属性
  // 创建后不允许直接修改
  write_only_insert?: boolean;
  // 禁止直接修改
  forbid_write?: boolean;
  // 创建时自动生成的默认值
  create_default?: string | number | (() => string | number);
  // 查询时关联的其他表
  join_table?: {
    type: 'INNER' | 'LEFT' | 'RIGHT';
    // 表名
    table: TableNames;
    // 需要被 join 的 table 的字段（key），及别名（value）
    fieldsMap: Record<string, string>;
    // 被 join 的匹配字段，默认为 id
    joinedField?: string;
  };
  // json 类型，配合 type: 'JSON' 使用
  json_type?: 'object-array' | 'object' | 'string-array';
}

// 表配置
export interface DBTable {
  name: string;
  unique?: string[];
  columns: DBTableCol[];
  // 多对多关联关系，查询返回 json 数组
  // key: 返回的字段名
  join_json_array?: Record<string, {
    // 主表主键，默认 id
    mainTablePrimaryField?: string;
    // 目标表主键，默认 id
    targetTablePrimaryField?: string;
    // 目标表名
    targetTableName: TableNames;
    // 中间表名
    middleTableName: TableNames;
    // 中间表与主表关联的字段
    middleMainField: string;
    // 中间表与目标表关联的字段
    middleTargetField: string;
    // 需要被 join 的 target table 的字段（key），及别名（value）
    // 默认全部
    fieldsMap?: Record<string, string>;
  }>;
}
