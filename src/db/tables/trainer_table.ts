import { DBTable } from '../interface';
import { getCommonTableColumns } from '../common';

const table: DBTable = {
  name: 'trainer',
  columns: [
    // {
    //   key: 'company',
    //   type: 'VARCHAR(100)',
    // },
    // {
    //   key: 'name',
    //   type: 'VARCHAR(100)',
    // },
    {
      key: 'staff_id',
      type: 'INT(11) UNSIGNED',
      comment: '关联的系统内的员工',
      join_table: {
        type: 'LEFT',
        table: 'staff',
        fieldsMap: {
          name: 'staff_name',
          sex: 'staff_sex',
          code: 'staff_code',
          phone: 'staff_phone',
          group_id: 'group_id',
        },
      },
    },
    // {
    //   key: 'code',
    //   type: 'CHAR(20)',
    // },
    // {
    //   key: 'phone',
    //   type: 'CHAR(20)',
    // },
    // {
    //   key: 'type',
    //   type: 'TINYINT',
    //   comment: '培训师类型',
    // },
    {
      key: 'level',
      type: 'TINYINT',
      comment: '培训师星级',
    },
    {
      key: 'remark',
      type: 'VARCHAR(255)',
    },
    ...getCommonTableColumns(),
  ],
};

export default table;
