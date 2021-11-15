import { DBTableCol, DBTable } from './interface';


// 基本表字段
export const commonTableColumns: DBTableCol[] = [
  {
    key: 'id',
    type: 'INT(11) UNSIGNED',
    auto_increment: true,
    primary_key: true,
    comment: '主键',
  },
  {
    key: 'is_delete',
    type: 'TINYINT',
    not_null: true,
    default: 0,
    comment: '是否已删除',
  },
  {
    key: 'created_time',
    type: 'DATETIME',
    not_null: true,
    comment: '创建时间',
  },
  {
    key: 'createrName',
    type: 'CHAR(20)',
  },
  {
    key: 'createrCode',
    type: 'CHAR(20)',
  },
  {
    key: 'createrId',
    type: 'INT(11) UNSIGNED',
  },
];
