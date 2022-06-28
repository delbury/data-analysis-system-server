import Koa from 'koa';
import { Response } from '~/interface';
import { db as dbAccount } from '~/router/account/db';
import moment from 'moment';

// 生成日期时间字符串
export const getDateTimeString =
  (date: Date | string | number = new Date()) => moment(date).format('YYYY-MM-DD HH:mm:ss');
export const getDateString =
  (date: Date | string | number = new Date()) => moment(date).format('YYYY-MM-DD');
export const getTimeString =
  (date: Date | string | number = new Date()) => moment(date).format('HH:mm:ss');

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

// 返回二进制数据
export const setBinaryResult = (ctx: Koa.ParameterizedContext, data: string, filename: string) => {
  ctx.set('content-disposition', `attchment; filename=${filename}`);

  const buffer = Buffer.from(data);
  ctx.body = buffer;
};

// 是否是管理员
export const isAdmin = async (ctx: Koa.ParameterizedContext) => {
  const pmap = (ctx.session?.apisMap ?? {}) as Record<string, boolean>;
  if(pmap['all']) {
    return true;
  }

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
