import Router from 'koa-router';
import { DB, createTable } from '../db/mysql';
import { WorkbenchTable, TeamGroupTable, StaffTable, RoleTable } from '../../types/tables';
import workbenchTableConfig from '../db/tables/workbench_table';
import teamGroupTableConfig from '../db/tables/team_group_table';
import staffTableConfig from '../db/tables/staff_table';
import roleTableConfig from '../db/tables/role_table';

const router = new Router();

const dbWorkbench = new DB<WorkbenchTable>('workbench', { includeFields: ['created_time', 'id'] });
const dbTeamGroup = new DB<TeamGroupTable>('team_group', { includeFields: ['created_time', 'id'] });
const dbStaff = new DB<StaffTable>('staff', { includeFields: ['created_time', 'id'] });
const dbRole = new DB<RoleTable>('role', { includeFields: ['created_time', 'id'] });

// 初始化数据
const teamGroupInitData: Partial<TeamGroupTable>[] = [
  { name: '5号线AFC商贸城工班' },
  { name: '5号线AFC塞云台工班' },
  { name: '5号线AFC九兴工班' },
  { name: '5号线AFC大源工班' },
  { name: '5号线风水电工班' },
  { name: '5号线消防工班' },
  { name: '5号线综合监控工班' },
  { name: '5号线屏电工班' },
  { name: '中铁十二局' },
  { name: '正立消防' },
  { name: '奥的斯机电' },
  { name: '三菱' },
  { name: '迅达' },
  { name: '今创' },
  { name: '惠民登辉' },
  { name: '维创' },
  { name: '技术组' },
];
const roleInitData: Partial<RoleTable>[] = [
  { name: '管理员', tag: 'admin' },
];

router.get('/test', async (ctx) => {

  ctx.body = {
    msg: 'ok',
    // res,
  };
}).get('/test/init', async (ctx) => {
  await createTable(workbenchTableConfig);
  await dbWorkbench.insertTestData(20);

  await createTable(teamGroupTableConfig);
  await dbTeamGroup.insert(teamGroupInitData);

  await createTable(staffTableConfig);
  await dbStaff.insertTestData(4);

  await createTable(roleTableConfig);
  await dbRole.insert(roleInitData);

  ctx.body = {
    msg: 'ok',
    // res,
  };
});

export default router;
