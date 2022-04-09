import Koa from 'koa';
import { Response } from '~/interface';
import { db as dbAccount } from '~/router/account/db';

// 请求错误
export const setError = (
  ctx: Koa.ParameterizedContext,
  code = 400,
  msg = '参数错误',
) => {
  ctx.status = code;
  ctx.body = <Response>{
    code: code,
    msg,
  };
};

// 请求成功
export const setResult = (
  ctx: Koa.ParameterizedContext,
  data: any = null,
  msg: string = null,
) => {
  ctx.body = <Response>{
    code: 200,
    data,
    msg,
  };
};

// 是否是管理员
export const isAdmin = async (ctx: Koa.ParameterizedContext) => {
  let authorization = ctx.headers.authorization;
  if(!authorization || !authorization.startsWith('Basic ')) return false;
  authorization = authorization.replace('Basic ', '');
  try {
    const [account, password] = Buffer.from(authorization, 'base64').toString().split(':');
    const res = await dbAccount.count(dbAccount.resolveFilters({
      account,
      password,
    }, { type: 'equal', hasPrefix: false }).resolved);
    return !!res;
  } catch(e) {
    console.log(e);
    return false;
  }
};
