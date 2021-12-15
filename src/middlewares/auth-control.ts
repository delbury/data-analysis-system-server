/**
 * 权限控制职中间件
 */

import Koa from 'koa';
import { AUTH_PATH_REG, ENV_PATH_REG } from '~/router';

export const authControl: Koa.Middleware = async (ctx, next) => {
  // 排除 auth 相关接口
  if(AUTH_PATH_REG.test(ctx.path) || ENV_PATH_REG.test(ctx.path)) {
    return await next();
  }

  if(!ctx.session.userInfo) {
    // 没有登录
    ctx.status = 412;
    ctx.body = {
      code: 412,
      msg: '请登录',
    };
  } else {
    const pmap = ctx.session.apisMap as Record<string, boolean>;
    const method = ctx.method.toUpperCase();

    // 全局权限控制
    if(
      pmap['all'] ||
      (pmap['all.read'] && method === 'GET')
    ) {
      return await next();
    }
    // 页面权限控制
    // paths: [BASE_URL, table_name, 'list']
    const paths = ctx.path.split('/').filter(it => !!it);
    if(
      pmap[paths[1]] ||
      (pmap[`${paths[1]}.read`] && method === 'GET')
    ) {
      return await next();
    }

    ctx.status = 412;
    ctx.body = {
      code: 412,
      msg: '没有该接口权限，请联系管理员',
    };
  }
};
