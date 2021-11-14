import Koa from 'koa';
import koaBody from 'koa-body';
import router from './router/index';

const app = new Koa();

app
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(4000);
