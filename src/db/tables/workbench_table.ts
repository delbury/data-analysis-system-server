import { DBTable } from '../interface';
import { getCommonTableColumns } from '../common';

const table: DBTable = {
  name: 'workbench',
  unique: ['train_project_name', 'project_code'],
  columns: [
    {
      key: 'status',
      type: 'TINYINT',
      comment: '1：计划培训，2：完成培训',
      default: 1,
    },
    {
      key: 'date',
      type: 'DATE',
    },
    {
      key: 'start_time',
      type: 'TIME',
    },
    {
      key: 'end_time',
      type: 'TIME',
    },
    {
      key: 'company',
      type: 'VARCHAR(100)',
    },
    {
      key: 'dept',
      type: 'VARCHAR(100)',
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
      key: 'project_code',
      type: 'CHAR(20)',
    },
    {
      key: 'train_project_name',
      type: 'VARCHAR(100)',
    },
    {
      key: 'train_course_name',
      type: 'VARCHAR(100)',
    },
    {
      key: 'train_level',
      type: 'VARCHAR(100)',
    },
    {
      key: 'train_content',
      type: 'VARCHAR(255)',
    },
    {
      key: 'train_way1',
      type: 'VARCHAR(100)',
    },
    {
      key: 'train_way2',
      type: 'VARCHAR(100)',
    },
    {
      key: 'train_type',
      type: 'CHAR(20)',
    },
    {
      key: 'train_class',
      type: 'VARCHAR(100)',
    },
    {
      key: 'maintainer',
      type: 'VARCHAR(100)',
    },
    {
      key: 'maintainer_code',
      type: 'VARCHAR(20)',
    },
    // {
    //   key: 'maintainer_id',
    //   type: 'INT(11)',
    // },
    {
      key: 'train_place',
      type: 'VARCHAR(100)',
    },
    // {
    //   key: 'trainer_id',
    //   type: 'INT(11)',
    // },
    {
      key: 'trainer',
      type: 'VARCHAR(100)',
    },
    {
      key: 'trainer_code',
      type: 'VARCHAR(20)',
    },
    {
      key: 'trainer_level',
      type: 'TINYINT',
      comment: '0：无，1：见习，2：一星，3：二星，4：三星',
    },
    {
      key: 'trainer_company',
      type: 'VARCHAR(100)',
    },
    {
      key: 'trained_count_manage',
      type: 'INT(10) UNSIGNED',
      default: 0,
    },
    {
      key: 'trained_count_key',
      type: 'INT(10) UNSIGNED',
      default: 0,
    },
    {
      key: 'trained_count_product',
      type: 'INT(10) UNSIGNED',
      default: 0,
    },
    {
      key: 'trained_count_new',
      type: 'INT(10) UNSIGNED',
      default: 0,
    },
    {
      key: 'trained_count_work',
      type: 'INT(10) UNSIGNED',
      default: 0,
    },
    {
      key: 'trained_count_total',
      type: 'INT(10) UNSIGNED',
      default: 0,
    },
    {
      key: 'trained_hours_theory',
      type: 'DECIMAL(5,2)',
      default: 0,
    },
    {
      key: 'trained_hours_practice',
      type: 'DECIMAL(5,2)',
      default: 0,
    },
    {
      key: 'trained_hours_total',
      type: 'DECIMAL(5,2)',
      default: 0,
    },
    {
      key: 'train_effect_count',
      type: 'INT(10) UNSIGNED',
      default: 0,
    },
    {
      key: 'student_evaluation_score',
      type: 'DECIMAL(5,2)',
      default: 0,
    },
    {
      key: 'maintainer_evaluation_score',
      type: 'DECIMAL(5,2)',
      default: 0,
    },
    {
      key: 'effect_evaluation_score',
      type: 'DECIMAL(5,2)',
      default: 0,
    },
    {
      key: 'course_pay',
      type: 'DECIMAL(10,2)',
      default: 0,
    },
    {
      key: 'remark',
      type: 'VARCHAR(255)',
    },
    ...getCommonTableColumns(),
  ],
};

export default table;
