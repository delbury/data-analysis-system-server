import { DBTableCol, DBTable } from './interface';
import moment from 'moment';

type Config = {
  id?: Partial<DBTableCol>
}

// 基本表字段
export const getCommonTableColumns: (config?: Config) => DBTableCol[] = (config = {}) => [
  {
    key: 'id',
    type: 'INT(11) UNSIGNED',
    auto_increment: true,
    primary_key: true,
    comment: '主键',
    ...(config.id ?? {}),
  },
  {
    key: 'is_delete',
    type: 'TINYINT',
    not_null: true,
    default: 0,
    comment: '是否已删除',
    forbid_write: true,
  },
  {
    key: 'is_system',
    type: 'TINYINT',
    default: 0,
    comment: '是否是系统创建的数据',
    write_only_insert: true,
  },
  {
    key: 'created_time',
    type: 'DATETIME',
    not_null: true,
    comment: '创建时间',
    write_only_insert: true,
    create_default: () => moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    key: 'last_modified_time',
    type: 'DATETIME',
    not_null: true,
    comment: '最后一次修改时间',
    forbid_write: true,
    create_default: () => moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    key: 'creater_id',
    type: 'INT(11) UNSIGNED',
    comment: '创建者',
    write_only_insert: true,
    // default: 0,
  },
  {
    key: 'last_modified_account_id',
    type: 'INT(11) UNSIGNED',
    comment: '最后一次修改者',
    forbid_write: true,
    // default: 0,
  },
];
