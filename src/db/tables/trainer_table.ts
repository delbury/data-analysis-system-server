import { DBTable } from '../interface';
import { getCommonTableColumns } from '../common';

const table: DBTable = {
  name: 'trainer',
  columns: [
    {
      key: 'company',
      type: 'VARCHAR(100)',
    },
    {
      key: 'name',
      type: 'VARCHAR(100)',
    },
    // {
    //   key: 'staff_id',
    //   type: 'INT(11) UNSIGNED',
    //   comment: '关联的系统内的员工',
    // },
    {
      key: 'code',
      type: 'CHAR(20)',
    },
    {
      key: 'phone',
      type: 'CHAR(20)',
    },
    {
      key: 'type',
      type: 'TINYINT',
    },
    {
      key: 'level',
      type: 'TINYINT',
    },
    {
      key: 'remark',
      type: 'VARCHAR(255)',
    },
    ...getCommonTableColumns(),
  ],
};

export default table;
