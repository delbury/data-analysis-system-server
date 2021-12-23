import { DBTable } from '../interface';
import { getCommonTableColumns } from '../common';

const table: DBTable = {
  name: 'account',
  // unique: ['account'],
  join_json_array: {
    roles: {
      middleTableName: 'middle_account_role',
      middleMainField: 'account_id',
      middleTargetField: 'role_id',
      targetTableName: 'role',
    },
  },
  columns: [
    {
      key: 'name',
      type: 'VARCHAR(100)',
    },
    {
      key: 'account',
      type: 'VARCHAR(100)',
      binary: true,
    },
    {
      key: 'password',
      type: 'VARCHAR(100)',
      binary: true,
    },
    {
      key: 'remark',
      type: 'VARCHAR(255)',
    },
    ...getCommonTableColumns(),
  ],
};

export default table;
