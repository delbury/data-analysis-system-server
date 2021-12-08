import { DBTable } from '../interface';
import { getCommonTableColumns } from '../common';

// 用于关联 account / role 两张表的联系

const table: DBTable = {
  name: 'middle_account_role',
  unique: ['account_id', 'role_id'],
  columns: [
    {
      key: 'account_id',
      type: 'INT(11) UNSIGNED',
      not_null: true,
    },
    {
      key: 'role_id',
      type: 'INT(11) UNSIGNED',
      not_null: true,
    },
    ...getCommonTableColumns(),
  ],
};

export default table;
