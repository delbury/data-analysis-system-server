
import Router from 'koa-router';
import { Response } from '../../interface';
import { db as dbAccount } from '../account';

const router = new Router();

// 登录
router.post('/login', async (ctx) => {
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

    ctx.body = <Response>{
      code: 200,
      data: info,
    };
  }
});

export default {
  router,
  baseUrl: '/auth',
};
