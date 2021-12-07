import Router from 'koa-router';
import { DB, createTable, runSql } from '../db/mysql';
import {
  WorkbenchTable,
  TeamGroupTable,
  StaffTable,
  RoleTable,
  PermissionTable,
  MiddleRolePermissionTable,
} from '../../types/tables';
import workbenchTableConfig from '../db/tables/workbench_table';
import teamGroupTableConfig from '../db/tables/team_group_table';
import staffTableConfig from '../db/tables/staff_table';
import roleTableConfig from '../db/tables/role_table';
import permissionConfig from '../db/tables/permission_table';
import middleRolePermissionConfig from '../db/tables/middle_role_permission_table';

const router = new Router();

const dbWorkbench = new DB<WorkbenchTable>('workbench');
const dbTeamGroup = new DB<TeamGroupTable>('team_group');
const dbStaff = new DB<StaffTable>('staff');
const dbRole = new DB<RoleTable>('role');
const dbPermission = new DB<PermissionTable>('permission');
const dbMiddleRolePermission = new DB<PermissionTable>('middle_role_permission');

// 初始化数据
const teamGroupInitData: Partial<TeamGroupTable>[] = [
  { name: '5号线AFC商贸城工班', type: 1 },
  { name: '5号线AFC塞云台工班', type: 1 },
  { name: '5号线AFC九兴工班', type: 1 },
  { name: '5号线AFC大源工班', type: 1 },
  { name: '5号线风水电工班', type: 1 },
  { name: '5号线消防工班', type: 1 },
  { name: '5号线综合监控工班', type: 1 },
  { name: '5号线屏电工班', type: 1 },
  { name: '中铁十二局', type: 2 },
  { name: '正立消防', type: 2 },
  { name: '奥的斯机电', type: 2 },
  { name: '三菱', type: 2 },
  { name: '迅达', type: 2 },
  { name: '今创', type: 2 },
  { name: '惠民登辉', type: 2 },
  { name: '维创', type: 2 },
  { name: '技术组', type: 2 },
];
const roleInitData: Partial<RoleTable>[] = [
  { name: '管理员' },
  { name: '管理员2' },
  { name: '管理员' },
];
const permissionInitData: Partial<PermissionTable>[] = [
  { name: '管理员权限', tags: ['all'], path: '/' },
  { name: '管理员权限2', tags: ['all', 'all.read', 'all.write'], path: '/' },
  { name: '管理员权限3', tags: ['all'], path: '/' },
];


router.get('/test', async (ctx) => {
  const res = await dbRole.runSql(`
    SELECT 
      a.id, 
      a.*, 
      CONCAT('[', GROUP_CONCAT(JSON_OBJECT('name', c.name, 'id', c.id)), ']') as list 
    FROM role as a
    LEFT JOIN middle_role_permission as b
    ON a.id = b.role_id
    LEFT JOIN permission as c
    ON b.permission_id = c.id
    GROUP BY a.id;
  `);

  ctx.body = {
    msg: 'ok',
    // res,
  };
}).get('/test/init', async (ctx) => {
  // 培训计划完成表
  // await createTable(workbenchTableConfig);
  // await dbWorkbench.insertTestData(20);

  // 班组表
  // await createTable(teamGroupTableConfig);
  // await dbTeamGroup.insert(teamGroupInitData);

  // 人员表
  // await createTable(staffTableConfig);
  // await dbStaff.insertTestData(4);

  // 角色表
  await createTable(roleTableConfig);
  const resRole = await dbRole.insert(roleInitData);

  // 权限表
  await createTable(permissionConfig);
  const resPermission = await dbPermission.insert(permissionInitData);

  // 角色、权限关系中间表
  const middleRolePermissionInitData: Partial<MiddleRolePermissionTable>[] = [];
  [[0, 0], [0, 1], [1, 1], [1, 2]].forEach(([role, perm]) => {
    middleRolePermissionInitData.push({
      role_id: resRole.length ? resRole[role].insertId : resRole.insertId,
      permission_id: resPermission.length ? resPermission[perm].insertId : resPermission.insertId,
    });
  });
  await createTable(middleRolePermissionConfig);
  await dbMiddleRolePermission.insert(middleRolePermissionInitData);

  ctx.body = {
    msg: 'ok',
    // res,
  };
});

export default router;
