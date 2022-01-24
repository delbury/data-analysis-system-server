import Koa from 'koa';
import { Response } from '~/interface';

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
