
import Router from 'koa-router';
import { Response } from '~/interface';
import { db as dbAccount } from '../account';

const router = new Router();

router
  // 登录
  .post('/login', async (ctx) => {
    const { account, password } = ctx.request.body;
    const res = await dbAccount.search(
      { pageNumber: 1, pageSize: 1 },
      dbAccount.resolveFilters({ account, password })
    );

    if(!res.total) {
      ctx.status = 412;
      ctx.body = <Response>{
        code: 412,
        data: null,
        msg: '账号或密码错误',
      };
    } else {
      const info = res.list[0];
      delete info.password;

      ctx.session.userInfo = info;

      ctx.body = <Response>{
        code: 200,
        data: info,
      };
    }
  })
  // 登出
  .post('/logout', async (ctx) => {
    if(ctx.session) {
      ctx.session = null;
    }
    ctx.body = {
      code: 200,
      data: null,
    };
  })
  // 获取用户信息
  .get('/info', async (ctx) => {
    ctx.body = {
      code: 200,
      data: !ctx.session?.userInfo ?? null,
    };
  });

export default {
  router,
  baseUrl: '/auth',
};
