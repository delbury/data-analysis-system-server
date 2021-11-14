import Router from 'koa-router';
import { run } from '../utils/mysql';
const router = new Router();

router.get('/test', async (ctx) => {
  run();

  ctx.body = {
    msg: 'ok',
  };
});

export default router;
