// 表字段配置
export interface DBTableCol {
  key: string;
  type: string;
  comment?: string;
  default?: string | number;
  auto_increment?: boolean;
  not_null?: boolean;
  primary_key?: boolean;
}

// 表配置
export interface DBTable {
  name: string;
  columns: DBTableCol[];
}
