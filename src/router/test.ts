import Router from 'koa-router';
import { DB } from '../db/mysql';
import { WorkbenchTable } from '../../types/tables';

const db = new DB<WorkbenchTable>('workbench', { includeFields: ['created_time', 'id'] });
const router = new Router();

router.get('/test', async (ctx) => {
  // await db.insert({ });
  const res = await db.search();
  console.log(res);

  ctx.body = {
    msg: 'ok',
    // res,
  };
});

export default router;
