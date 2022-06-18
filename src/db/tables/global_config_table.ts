import { DBTable } from '../interface';
import { getCommonTableColumns } from '../common';

const table: DBTable = {
  name: 'global_config',
  unique: ['key'],
  columns: [
    {
      key: 'label',
      type: 'VARCHAR(100)',
      comment: '配置项的名称',
    },
    {
      key: 'key',
      type: 'VARCHAR(100)',
      comment: '配置项的key',
    },
    {
      key: 'value',
      type: 'VARCHAR(100)',
      comment: '配置项的value',
    },
    {
      key: 'type',
      type: 'TINYINT',
      comment: '配置项的value类型，1：int，2：float，3：string',
    },
    {
      key: 'remark',
      type: 'VARCHAR(255)',
    },
    ...getCommonTableColumns(),
  ],
};

export default table;
