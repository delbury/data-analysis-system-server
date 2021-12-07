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
      key: 'tags',
      type: 'JSON',
      comment: '权限列表',
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
