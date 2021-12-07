import { DBTable } from '../interface';
import { getCommonTableColumns } from '../common';

// 用于关联 role / permission 两张表的联系

const table: DBTable = {
  name: 'middle_role_permission',
  unique: ['role_id', 'permission_id'],
  columns: [
    {
      key: 'role_id',
      type: 'INT(11) UNSIGNED',
      not_null: true,
    },
    {
      key: 'permission_id',
      type: 'INT(11) UNSIGNED',
      not_null: true,
    },
    ...getCommonTableColumns(),
  ],
};

export default table;
