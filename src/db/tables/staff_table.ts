import { DBTable } from '../interface';
import { commonTableColumns } from '../common';

const table: DBTable = {
  name: 'staff',
  columns: [
    {
      key: 'name',
      type: 'VARCHAR(100)',
    },
    {
      key: 'remark',
      type: 'VARCHAR(255)',
    },
    ...commonTableColumns,
  ],
};

export default table;
