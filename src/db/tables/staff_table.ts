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
      key: 'sex',
      type: 'TINYINT',
      comment: '性别，1：男，2：女',
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
      key: 'position',
      type: 'VARCHAR(100)',
      comment: '岗位',
    },
    {
      key: 'level',
      type: 'TINYINT',
      comment: '培训师星级，0：无，1：见习，2：一星，3：二星，4：三星',
      default: 0,
    },
    {
      key: 'has_cert',
      type: 'TINYINT',
      comment: '是否取得上岗资格证书，0：否，1：是',
    },
    {
      key: 'join_date',
      type: 'date',
      comment: '入职时间',
    },
    {
      key: 'quit_date',
      type: 'date',
      comment: '离职时间',
    },
    {
      key: 'status',
      type: 'TINYINT',
      comment: '人员状态，0：离职，1：在职',
    },
    {
      key: 'remark',
      type: 'VARCHAR(255)',
    },
    ...getCommonTableColumns(),
  ],
};

export default table;
