import Router from 'koa-router';
import { DB, createTable } from '../db/mysql';
import workbenchTableConfig from '../db/tables/workbench_table';
import teamGroupTableConfig from '../db/tables/team_group_table';
import staffTableConfig from '../db/tables/staff_table';
import { WorkbenchTable, TeamGroupTable, StaffTable } from '../../types/tables';

const router = new Router();

const dbWorkbench = new DB<WorkbenchTable>('workbench', { includeFields: ['created_time', 'id'] });
const dbTeamGroup = new DB<WorkbenchTable>('team_group', { includeFields: ['created_time', 'id'] });
const dbStaff = new DB<WorkbenchTable>('staff', { includeFields: ['created_time', 'id'] });

router.get('/test', async (ctx) => {

  ctx.body = {
    msg: 'ok',
    // res,
  };
}).get('/test/init', async (ctx) => {
  // await createTable(workbenchTableConfig);
  // await dbWorkbench.insertTestData(2);

  // await createTable(teamGroupTableConfig);
  // await dbTeamGroup.insertTestData(4);

  await createTable(staffTableConfig);
  await dbStaff.insertTestData(4);

  ctx.body = {
    msg: 'ok',
    // res,
  };
});

export default router;
