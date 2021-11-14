import Router from 'koa-router';
import workbench from './workbench';
import test from './test';

const router = new Router();
router
  .use('/workbench', workbench.routes())
  .use(test.routes());

export default router;
