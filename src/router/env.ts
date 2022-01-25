import Router from 'koa-router';
import { DB, createTable, runSql } from '../db/mysql';
import { setResult, isAdmin, setError } from '~/util';
import { nanoid } from 'nanoid';
import {
  WorkbenchTable,
  TeamGroupTable,
  StaffTable,
  RoleTable,
  PermissionTable,
  AccountTable,
  MiddleRolePermissionTable,
  MiddleAccountRoleTable,
} from '~types/tables';
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
  { name: '5号线AFC赛云台工班', type: 1 },
  { name: '5号线AFC九兴工班', type: 1 },
  { name: '5号线AFC大源工班', type: 1 },
  { name: '5号线风水电工班', type: 1 },
  { name: '5号线消防工班', type: 1 },
  { name: '5号线综合监控工班', type: 1 },
  { name: '5号线屏电工班', type: 1 },
  { name: '技术组', type: 1 },
  { name: '中铁十二局', type: 2 },
  { name: '正立消防', type: 2 },
  { name: '奥的斯机电', type: 2 },
  { name: '三菱', type: 2 },
  { name: '迅达', type: 2 },
  // { name: '今创', type: 2 },
  // { name: '惠民登辉', type: 2 },
  { name: '方大', type: 2 },
  { name: '维创', type: 2 },
];
const roleInitData: Partial<RoleTable>[] = [
  { name: '管理员', is_system: 1 },
  ...teamGroupInitData.map(it => ({ name: it.name + '用户' })),
];
const middleRolePermission = roleInitData.map((it, ind) => [ind, ind]);
const permissionInitData: Partial<PermissionTable>[] = [
  { name: '管理员权限', apis: ['all'], path: '/', is_system: 1 },
];
const middleAccountRole = middleRolePermission;
const accountInitData: Partial<AccountTable>[] = [
  { name: '管理员账号', account: 'admin', password: '123456a', is_system: 1 },
  ...teamGroupInitData.map(
    (it, index) => ({
      name: it.name + '账号',
      account: `user${(index + 1).toString().padStart(3, '0')}`,
      password: nanoid(8),
    })
  ),
];

export const initDbTables = async (globalForce = false) => {
  // 培训计划完成表
  const resWorkbenchCreate = await createTable(workbenchTableConfig, globalForce);

  // 班组表
  const resTeamGroupCreate = await createTable(teamGroupTableConfig, globalForce);
  const resTeamGroup = resTeamGroupCreate ? await dbTeamGroup.insert(teamGroupInitData, true) : null;
  (resTeamGroup as any[] ?? []).forEach((item, index) => {
    const id = item.insertId;
    permissionInitData.push({
      name: teamGroupInitData[index].name + '权限',
      apis: ['workbench', 'team_group'],
      datas: [`workbench.group_id.${id}`, `team_group.id.${id}`],
      path: '/workbench',
    });
  });

  // 人员表
  const resStaffCreate = await createTable(staffTableConfig, globalForce);

  // 权限表
  const resPermissionCreate = await createTable(permissionConfig, globalForce);
  const resPermission = resPermissionCreate ? await dbPermission.insert(permissionInitData, true) : null;

  // 角色表
  const resRoleCreate = await createTable(roleTableConfig, globalForce);
  const resRole = resRoleCreate ? await dbRole.insert(roleInitData, true) : null;

  // 账号表
  const resAccountCreate = await createTable(accountConfig, globalForce);
  const resAccount = resAccountCreate ? await dbAccount.insert(accountInitData, true) : null;

  // 角色、权限关系中间表
  if(resRole && resPermission) {
    const middleRolePermissionInitData: Partial<MiddleRolePermissionTable>[] = [];
    middleRolePermission.forEach(([role, perm]) => {
      middleRolePermissionInitData.push({
        role_id: resRole.length ? resRole[role].insertId : resRole.insertId,
        permission_id: resPermission.length ? resPermission[perm].insertId : resPermission.insertId,
      });
    });
    await createTable(middleRolePermissionConfig, globalForce);
    await dbMiddleRolePermission.insert(middleRolePermissionInitData, true);
  }

  // 账号、角色关系中间表
  if(resRole && resAccount) {
    const middleAccountRoleInitData: Partial<MiddleAccountRoleTable>[] = [];
    middleAccountRole.forEach(([role, perm]) => {
      middleAccountRoleInitData.push({
        role_id: resRole.length ? resRole[role].insertId : resRole.insertId,
        account_id: resAccount.length ? resAccount[perm].insertId : resAccount.insertId,
      });
    });
    await createTable(middleAccountRoleConfig, globalForce);
    await dbMiddleAccountRole.insert(middleAccountRoleInitData, true);
  }
};

router
  .get('/test', async (ctx) => {
    setResult(ctx, null, 'GET OK');
  })
  .post('/test', async (ctx) => {
    setResult(ctx, null, 'POST OK');
  })
  .post('/init', async (ctx) => {
    if(await isAdmin(ctx)) {
      const { force = false } = ctx.request.body;
      console.log(ctx.request.body);
      await initDbTables(force);
      setResult(ctx, null, 'INIT OK');
    } else {
      setError(ctx, 412, '没有权限');
    }
  });

export default {
  router,
  baseUrl: '/env',
};
