import { DBTable } from '../interface';
import { getCommonTableColumns } from '../common';

const table: DBTable = {
  name: 'staff',
  columns: [
    {
      key: 'name',
      type: 'VARCHAR(100)',
    },
    {
      key: 'code',
      type: 'CHAR(20)',
    },
    {
      key: 'phone',
      type: 'CHAR(20)',
    },
    {
      key: 'group_id',
      type: 'INT(11)',
      join_table: {
        type: 'LEFT',
        table: 'team_group',
        fieldsMap: {
          name: 'group_name',
          type: 'group_type',
        },
      },
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
    ...getCommonTableColumns(),
  ],
};

export default table;
