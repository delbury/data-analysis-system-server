import Router from 'koa-router';
import { DB, createTable, runSql } from '../db/mysql';
import {
  WorkbenchTable,
  TeamGroupTable,
  StaffTable,
  RoleTable,
  PermissionTable,
  AccountTable,
  MiddleRolePermissionTable,
  MiddleAccountRoleTable,
} from '../../types/tables';
import workbenchTableConfig from '../db/tables/workbench_table';
import teamGroupTableConfig from '../db/tables/team_group_table';
import staffTableConfig from '../db/tables/staff_table';
import roleTableConfig from '../db/tables/role_table';
import permissionConfig from '../db/tables/permission_table';
import accountConfig from '../db/tables/account_table';
import middleRolePermissionConfig from '../db/tables/middle_role_permission_table';
import middleAccountRoleConfig from '../db/tables/middle_account_role_table';


const router = new Router();

const dbWorkbench = new DB<WorkbenchTable>('workbench');
const dbTeamGroup = new DB<TeamGroupTable>('team_group');
const dbStaff = new DB<StaffTable>('staff');
const dbRole = new DB<RoleTable>('role');
const dbPermission = new DB<PermissionTable>('permission');
const dbAccount = new DB<PermissionTable>('account');
const dbMiddleRolePermission = new DB<PermissionTable>('middle_role_permission');
const dbMiddleAccountRole = new DB<PermissionTable>('middle_account_role');

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
];
const permissionInitData: Partial<PermissionTable>[] = [
  { name: '管理员权限', tags: ['all'], path: '/' },
  { name: '全局只读', tags: ['all.read'], path: '/' },
  { name: '培训计划完成表', tags: ['workbench'], path: '/workbench' },
];
const accountInitData: Partial<AccountTable>[] = [
  { name: '管理员', account: 'admin', password: '123456a' },
];


router.get('/test', async (ctx) => {
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

  // 账号表
  await createTable(accountConfig);
  const resAccount = await dbAccount.insert(accountInitData);

  // 角色、权限关系中间表
  const middleRolePermissionInitData: Partial<MiddleRolePermissionTable>[] = [];
  [[0, 0]].forEach(([role, perm]) => {
    middleRolePermissionInitData.push({
      role_id: resRole.length ? resRole[role].insertId : resRole.insertId,
      permission_id: resPermission.length ? resPermission[perm].insertId : resPermission.insertId,
    });
  });
  await createTable(middleRolePermissionConfig);
  await dbMiddleRolePermission.insert(middleRolePermissionInitData);

  // 账号、角色关系中间表
  const middleAccountRoleInitData: Partial<MiddleAccountRoleTable>[] = [];
  [[0, 0]].forEach(([role, perm]) => {
    middleAccountRoleInitData.push({
      role_id: resRole.length ? resRole[role].insertId : resRole.insertId,
      account_id: resAccount.length ? resAccount[perm].insertId : resAccount.insertId,
    });
  });
  await createTable(middleAccountRoleConfig);
  await dbMiddleAccountRole.insert(middleAccountRoleInitData);


  ctx.body = {
    msg: 'ok',
    // res,
  };
});

export default router;
