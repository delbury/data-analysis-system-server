import { DBTable } from '../interface';
import { getCommonTableColumns } from '../common';

const table: DBTable = {
  name: 'permission',
  columns: [
    {
      key: 'name',
      type: 'VARCHAR(100)',
    },
    {
      key: 'path',
      type: 'VARCHAR(100)',
      comment: '页面路径',
    },
    {
      key: 'apis',
      type: 'JSON',
      comment: '接口权限列表',
      json_type: 'string-array',
    },
    {
      key: 'datas',
      type: 'JSON',
      comment: '数据权限列表',
      json_type: 'string-array',
    },
    {
      key: 'elms',
      type: 'JSON',
      comment: '页面元素权限列表',
      json_type: 'string-array',
    },
    {
      key: 'remark',
      type: 'VARCHAR(255)',
    },
    ...getCommonTableColumns(),
  ],
};

export default table;
