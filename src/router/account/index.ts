import { createRouter } from '../RESTfulBase';
import { DB } from '~/db/mysql';
import { AccountTable } from '~types/tables';
import { db as dbRole } from '../role';
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
});
