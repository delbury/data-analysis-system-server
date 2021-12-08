import Koa from 'koa';
import koaBody from 'koa-body';
import router from './router/index';
import { Response } from './interface';

const app = new Koa();

app
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
app.listen(4000);
