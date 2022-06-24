
import Router from 'koa-router';
import { db as dbAccount } from '../account/db';
import { updateSession } from './tools';
import { setResult, setError } from '~/util';

const router = new Router();

router
  // 登录
  .post('/login', async (ctx) => {
    const { account, password } = ctx.request.body;
    const res = await dbAccount.search(
      { pageNumber: 1, pageSize: 1 },
      dbAccount.resolveFilters({ account, password }).resolved,
      { filterDeleted: true },
    );

    if(!res.total) {
      setError(ctx, 412, '账号或密码错误');
    } else {
      // 查询并设置 session
      await updateSession(ctx, res.list[0]);

      setResult(ctx, ctx.session.userInfo);
    }
  })
  // 登出
  .post('/logout', async (ctx) => {
    if(ctx.session) {
      ctx.session = null;
    }

    setResult(ctx);
  })
  // 获取已登录用户信息
  .get('/info', async (ctx) => {
    setResult(ctx, ctx.session?.userInfo ?? null);
  })
  .put('/password', async (ctx) => {
    const { oldPassword, newPassword, newPasswordCheck } = ctx.request.body;

    let status = 200;
    let msg = null;

    if(!ctx.session.userInfo) {
      status = 400;
      msg = '请先登录';
    } else if(newPassword !== newPasswordCheck) {
      status = 400;
      msg = '两次输入的新密码不一致';
    } else {
      const res = await dbAccount.search(
        { pageNumber: 1, pageSize: 1 },
        dbAccount.resolveFilters({ account: ctx.session.userInfo.account, password: oldPassword }).resolved
      );
      if(!res.total) {
        status = 400;
        msg = '旧密码错误';
      } else {
        const id = res.list[0].id;
        await dbAccount.update(id, { password: newPassword }, { force: true });
      }
    }

    if(status === 200) {
      setResult(ctx, null, msg);
    } else {
      setError(ctx, status, msg);
    }
  });

export default {
  router,
  baseUrl: '/auth',
};
