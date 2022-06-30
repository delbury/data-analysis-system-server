import { promisify } from 'util';
import child_process from 'child_process';
import Router from 'koa-router';
import { DB, createTable, mysqlConfig, backupDb } from '../db/mysql';
import { setResult, isAdmin, setError, setBinaryResult, getDateTimeString } from '~/util';
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
  TrainerTable,
  GlobalConfigTable,
} from '~types/tables';
import workbenchTableConfig from '../db/tables/workbench_table';
import teamGroupTableConfig from '../db/tables/team_group_table';
import staffTableConfig from '../db/tables/staff_table';
import roleTableConfig from '../db/tables/role_table';
import permissionConfig from '../db/tables/permission_table';
import accountConfig from '../db/tables/account_table';
import middleRolePermissionConfig from '../db/tables/middle_role_permission_table';
import middleAccountRoleConfig from '../db/tables/middle_account_role_table';
import trainerTableConfig from '../db/tables/trainer_table';
import globalConfigTableConfig from '../db/tables/global_config_table';

const exec = promisify(child_process.exec);

const router = new Router();

const dbWorkbench = new DB<WorkbenchTable>('workbench');
const dbTeamGroup = new DB<TeamGroupTable>('team_group');
const dbStaff = new DB<StaffTable>('staff');
const dbRole = new DB<RoleTable>('role');
const dbPermission = new DB<PermissionTable>('permission');
const dbAccount = new DB<PermissionTable>('account');
const dbMiddleRolePermission = new DB<PermissionTable>('middle_role_permission');
const dbMiddleAccountRole = new DB<PermissionTable>('middle_account_role');
const dbTrainer = new DB<TrainerTable>('trainer');
const dbGlobalConfig = new DB<GlobalConfigTable>('global_config');

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

const globalConfigData: Partial<GlobalConfigTable>[] = [
  {
    label: '项目编号偏移值',
    key: 'project_code_offset',
    value: '0',
    type: 1,
    remark: '全部项目编号的偏移值，如果要精确控制到某一类的偏移值，请创建 "project_code_offset_${code}" 的配置项',
  },
  { label: '项目编号偏移值-安全类培训', key: 'project_code_offset_116', value: '0', type: 1 },
  { label: '项目编号偏移值-车间综合管理类培训', key: 'project_code_offset_117', value: '0', type: 1 },
  { label: '项目编号偏移值-继续教育学时学分制培训', key: 'project_code_offset_118', value: '0', type: 1 },
  { label: '项目编号偏移值-综合监控专业知识培训', key: 'project_code_offset_119', value: '0', type: 1 },
  { label: '项目编号偏移值-消防专业知识培训', key: 'project_code_offset_120', value: '0', type: 1 },
  { label: '项目编号偏移值-屏蔽门专业知识培训', key: 'project_code_offset_121', value: '0', type: 1 },
  { label: '项目编号偏移值-电扶梯专业知识培训', key: 'project_code_offset_122', value: '0', type: 1 },
  { label: '项目编号偏移值-风水电专业知识培训', key: 'project_code_offset_123', value: '0', type: 1 },
  { label: '项目编号偏移值-AFC专业知识培训', key: 'project_code_offset_124', value: '0', type: 1 },
];

export const initDbTables = async (globalForce = false) => {
  // 全局配置表
  const resGlobalConfigCreate = await createTable(globalConfigTableConfig, globalForce);
  const resGlobalConfig = resGlobalConfigCreate ? await dbGlobalConfig.insert(globalConfigData, true) : null;

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

  // 培训师表
  const resTrainerCreate = await createTable(trainerTableConfig, globalForce);

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

      await initDbTables(force);
      setResult(ctx, null, 'INIT OK');
    } else {
      setError(ctx, 412, '没有权限');
    }
  })
  // 初始化数据库表
  .post('/recreate', async (ctx) => {
    if(await isAdmin(ctx)) {
      const { tableName } = ctx.request.body;

      switch(tableName) {
        case 'workbench':
          await createTable(workbenchTableConfig, true);
          break;
        default:
          setError(ctx);
          return;
      }
      setResult(ctx, null, `${tableName} CREATED OK`);
    } else {
      setError(ctx, 412, '没有权限');
    }
  })
  // 数据库备份
  .get('/backup', async (ctx) => {
    if(await isAdmin(ctx)) {
      const res = await backupDb();
      const stdout = res.dump.schema + '\n\n' + res.dump.data;
      // const pw = mysqlConfig.password;
      // const dbName = mysqlConfig.database;
      // const containerName = 'data-analysis-system_mysql_1';
      // const cmd = `docker exec ${containerName} bash -c 'exec mysqldump --databases ${dbName} -uroot -p"${pw}"'`;
      // const { stdout, stderr } = await exec(cmd);
      setBinaryResult(ctx, stdout, `backup_${getDateTimeString()}.sql`);
    } else {
      setError(ctx, 412, '没有权限');
    }
  });

export default {
  router,
  baseUrl: '/env',
};
