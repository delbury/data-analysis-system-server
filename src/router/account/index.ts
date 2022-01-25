import { createRouter } from '../RESTfulBase';
import { updateSession } from '../auth/tools';
import { db } from './db';

export default createRouter(db, {
  // 更新 session
  afterUpdate: async (ctx, id) => {
    // 修改了当前账号后，更新当前账号的 session
    if(`${ctx.session.userInfo.id}` === `${id}`) {
      await updateSession(ctx, id);
    }

    // TODO 更新对应已登录 id 的账号 session
  },
  afterDelete: (ctx, id) => {
    // 删除了当前账号后，session 失效
    if(`${ctx.session.userInfo.id}` === `${id}`) {
      ctx.session = null;
    }
  },
  // 添加前校验
  beforeInsert: async (ctx, data) => {
    const res = await db.search(
      { all: 1 },
      db.resolveFilters({ account: data.account, is_delete: '0' })
    );
    if(res.total) return '该帐号已存在';
  },
});
