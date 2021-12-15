import { createRouter } from '../RESTfulBase';
import { DB } from '~/db/mysql';
import { RoleTable } from '~types/tables';
import { updateSession } from '../auth/tools';

export const db = new DB<RoleTable>('role', {});

export default createRouter(db, {
  // 更新 session
  afterUpdate: async (ctx, id) => {
    await updateSession(ctx);
  },
  afterDelete: async (ctx, id) => {
    await updateSession(ctx);
  },
});
