import { createRouter } from '../RESTfulBase';
import { DB } from '~/db/mysql';
import { PermissionTable } from '~types/tables';
import { updateSession } from '../auth/tools';

const db = new DB<PermissionTable>('permission', {});

export default createRouter(db, {
  // 更新 session
  afterUpdate: async (ctx, id) => {
    await updateSession(ctx);
  },
  afterDelete: async (ctx, id) => {
    await updateSession(ctx);
  },
});
