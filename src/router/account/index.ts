import { createRouter } from '../RESTfulBase';
import { DB } from '~/db/mysql';
import { AccountTable } from '~types/tables';
import { db as dbRole } from '../role';

export const db = new DB<AccountTable>('account', {});

export default createRouter(db, {
  // 更新 session
  afterUpdate: async (ctx, id) => {
    // 修改了当前账号后，更新 session
    const info = await db.detail(id);
    delete info.password;

    // 查询所有权限
    const roleIds = info.roles.map(it => `${it.id}`);
    const roles = await dbRole.search({ all: 1 }, dbRole.resolveFilters({ id: roleIds }));
    const permissions = roles.list.map(it => it.permissions).flat().map(it => it.apis).flat();
    const permissionsList = permissions;

    ctx.session.userInfo = { ...info, roles: roles.list };
    ctx.session.permissionsList = permissionsList;
  },
  afterDelete: (ctx, id) => {
    // 删除了当前账号后，session 失效
    if(`${ctx.session.userInfo.id}` === `${id}`) {
      ctx.session = null;
    }
  },
});
