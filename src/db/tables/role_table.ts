import { DBTable } from '../interface';
import { getCommonTableColumns } from '../common';

const table: DBTable = {
  name: 'role',
  join_json_array: {
    permissions: {
      middleTableName: 'middle_role_permission',
      middleMainField: 'role_id',
      middleTargetField: 'permission_id',
      targetTableName: 'permission',
    },
  },
  columns: [
    {
      key: 'name',
      type: 'VARCHAR(100)',
    },
    {
      key: 'remark',
      type: 'VARCHAR(255)',
    },
    ...getCommonTableColumns(),
  ],
};

export default table;
