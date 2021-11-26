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
      key: 'code',
      type: 'CHAR(10)',
    },
    {
      key: 'phone',
      type: 'CHAR(15)',
    },
    {
      key: 'company',
      type: 'VARCHAR(100)',
    },
    {
      key: 'job',
      type: 'VARCHAR(100)',
      comment: '职系序列',
    },
    {
      key: 'has_cert',
      type: 'TINYINT',
      comment: '是否取得上岗资格证书',
    },
    {
      key: 'remark',
      type: 'VARCHAR(255)',
    },
    ...commonTableColumns,
  ],
};

export default table;
