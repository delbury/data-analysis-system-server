import Koa from 'koa';
import koaBody from 'koa-body';
import router, { AUTH_PATH_REG } from './router';
import { Response } from './interface';
import session from 'koa-session';
import { sessionConfig } from './config';

const app = new Koa();
app.keys = ['wHlAEu0VOzHPRCcVj2TjPk1jWk9vOeVJ'];

app
  .use(session(sessionConfig, app))
  .use(async (ctx, next) => {
    if(!AUTH_PATH_REG.test(ctx.path) && !ctx.session.userInfo) {
      // 没有登录
      ctx.status = 412;
      ctx.body = {
        code: 412,
        msg: '请登录',
      };
    }
    await next();
  })
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
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(4000, () => {
  console.log('server started !');
});
