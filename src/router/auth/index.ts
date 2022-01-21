
import Router from 'koa-router';
import { Response } from '~/interface';
import { db as dbAccount } from '../account';
import { updateSession } from './tools';

const router = new Router();

router
  // 登录
  .post('/login', async (ctx) => {
    const { account, password } = ctx.request.body;
    const res = await dbAccount.search(
      { pageNumber: 1, pageSize: 1 },
      dbAccount.resolveFilters({ account, password }),
      { filterDeleted: true },
    );

    if(!res.total) {
      ctx.status = 412;
      ctx.body = <Response>{
        code: 412,
        data: null,
        msg: '账号或密码错误',
      };
    } else {
      // 查询并设置 session
      await updateSession(ctx, res.list[0]);

      ctx.body = <Response>{
        code: 200,
        data: ctx.session.userInfo,
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
  // 获取已登录用户信息
  .get('/info', async (ctx) => {
    ctx.body = {
      code: 200,
      data: ctx.session?.userInfo ?? null,
    };
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
        dbAccount.resolveFilters({ account: ctx.session.userInfo.account, password: oldPassword })
      );
      if(!res.total) {
        status = 400;
        msg = '旧密码错误';
      } else {
        const id = res.list[0].id;
        await dbAccount.update(id, { password: newPassword }, { force: true });
      }
    }

    ctx.status = status;
    ctx.body = {
      code: status,
      msg,
    };
  });

export default {
  router,
  baseUrl: '/auth',
};
