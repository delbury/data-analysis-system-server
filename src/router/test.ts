import Router from 'koa-router';
import { DB, createTable } from '../db/mysql';
import workbenchTableConfig from '../db/tables/workbench_table';
import { WorkbenchTable } from '../../types/tables';
import { DBTable } from '../db/interface';

const db = new DB<WorkbenchTable>('workbench', { includeFields: ['created_time', 'id'] });
const router = new Router();


router.get('/test', async (ctx) => {
  await db.insertTestData(30);
  // createTable(workbenchTableConfig);
  // const res = await db.detail('1');
  // console.log(res);

  ctx.body = {
    msg: 'ok',
    // res,
  };
});

export default router;
