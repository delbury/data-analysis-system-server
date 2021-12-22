import './pre';
import Koa from 'koa';
import koaBody from 'koa-body';
import router from './router';
import { Response } from './interface';
import session from 'koa-session';
import { sessionConfig } from './configs/session';
import { authControl } from './middlewares/auth-control';
import { initDbTables } from '~/router/env';

const app = new Koa();
app.keys = ['wHlAEu0VOzHPRCcVj2TjPk1jWk9vOeVJ'];

app
  // 错误捕获
  .use(async (ctx, next) => {
    try {
      await next();
    } catch(err) {
      console.error(err);
      ctx.status = 400;
      ctx.body = <Response>{
        code: 400,
        msg: err.message,
      };
    }
  })
  .use(session(sessionConfig, app))
  .use(authControl)
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(4000, async () => {
  try {
    await initDbTables();
  } catch(e) {
    console.log('database table init failed !');
    throw e;
  }
  console.log('server started !');
});
