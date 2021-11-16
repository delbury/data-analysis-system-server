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
}

// 表配置
export interface DBTable {
  name: string;
  columns: DBTableCol[];
}
