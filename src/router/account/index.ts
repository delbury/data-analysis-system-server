import { createRouter } from '../RESTfulBase';
import { DB } from '~/db/mysql';
import { AccountTable } from '~types/tables';
import { updateSession } from '../auth/tools';

export const db = new DB<AccountTable>('account', {});

export default createRouter(db, {
  // 更新 session
  afterUpdate: async (ctx, id) => {
    // 修改了当前账号后，更新 session
    await updateSession(ctx, id);
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
