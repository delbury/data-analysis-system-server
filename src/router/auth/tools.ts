import Koa from 'koa';
import { AccountTable } from '~types/tables';
import { db as dbAccount } from '../account/db';
import { db as dbRole } from '../role';

export type ApisMap = Record<string, boolean>;
export type DatasMap = Record<string, Record<string, string[]>>;
export type ElmsMap = Record<string, boolean>;


// 更新 session
export const updateSession = async (ctx: Koa.ParameterizedContext, idOrInfo?: string | AccountTable) => {
  let info: AccountTable;
  if(!idOrInfo) {
    // 使用 session 内的 account id
    info = await dbAccount.detail(ctx.session.userInfo.id);
  } else if(typeof idOrInfo === 'string') {
    // 当传入的值为 id
    info = await dbAccount.detail(idOrInfo, dbAccount.resolveFilters({ is_delete: '0' }).resolved);
  } else {
    // 当传入的值为 user info
    info = idOrInfo;
  }

  delete info.password;

  // 查询所有权限
  const roleIds = info.roles.map(it => `${it.id}`);
  const roles = await dbRole.search({ all: 1 }, dbRole.resolveFilters({ id: roleIds }).resolved);
  const permissions = roles.list.map(it => it.permissions).flat();

  // 接口权限
  const apis = permissions.map(it => it.apis ?? []).flat();
  const apisMap: ApisMap = {};
  apis.forEach(p => (apisMap[p] = true));

  // 接口数据权限
  const datas = permissions.map(it => it.datas ?? []).flat();
  const datasMap: DatasMap = {};

  datas.forEach(p => {
    // table.field.value
    const configs = p.split('.');
    if(configs.length !== 3) return;
    const [table, field, value] = configs;
    if(datasMap[table]) {
      if(datasMap[table][field]) {
        datasMap[table][field].push(value);
      } else {
        datasMap[table][field] = [value];
      }
    } else {
      datasMap[table] = {
        [field]: [value],
      };
    }
  });

  ctx.session.userInfo = { ...info, roles: roles.list };
  ctx.session.apisMap = apisMap;
  ctx.session.datasMap = datasMap;
};
