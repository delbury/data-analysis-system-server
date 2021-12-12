import Router from 'koa-router';
import { DB } from '../db/mysql';
import { Response } from '../interface';
import Koa from 'koa';
import { CommonTable } from '~types/tables/Common';

interface Hanlders {
  afterInseart?: (ctx: Koa.ParameterizedContext, id: string) => void;
  afterUpdate?: (ctx: Koa.ParameterizedContext, id: string) => void;
  afterDelete?: (ctx: Koa.ParameterizedContext, id: string) => void;
}

export const createRouter = <T extends CommonTable>(db: DB<T>, handlers: Hanlders = {}) => {
  const router = new Router();

  router
    // 查询
    .get('/list/', async (ctx) => {
      const pageSize = Number(ctx.query.pageSize) || 20;
      const pageNumber = Number(ctx.query.pageNumber) || 1;
      const all = Number(ctx.query.all) || 0;
      const orderBy = (ctx.query.orderBy || 'created_time') as any;
      // 默认降序
      const order = ctx.query.order === 'asc' ? 'asc' : 'desc';
      // 其他查询条件
      const filters = { ...(ctx.query ?? {}) };
      delete filters.pageSize;
      delete filters.pageNumber;
      delete filters.all;
      delete filters.orderBy;
      delete filters.order;

      const res = await db.search(
        { pageSize, pageNumber, all, orderBy, order },
        db.resolveFilters(filters, 'auto'),
      );
      ctx.body = <Response>{
        code: 200,
        data: {
          total: res.total,
          list: res.list,
        },
      };
    })
    // 详情
    .get('/list/:id/', async (ctx) => {
      const id: string = ctx.params.id;
      if(!id) throw Error('no id');

      const res = await db.detail(id);
      ctx.body = <Response>{
        code: 200,
        data: res,
      };
    })
    // 添加
    .post('/list/', async (ctx) => {
      const res = await db.insert({
        ...ctx.request.body ?? {},
        // 设置创建者
        creater_id: ctx.session.userInfo.id as number,
      });

      // 添加成功后的回调
      if(handlers.afterInseart) {
        await handlers.afterInseart(ctx, res.insertId as string);
      }

      ctx.body = <Response>{
        code: 200,
        data: null,
      };
    })
    // 修改
    .put('/list/:id/', async (ctx) => {
      const id: string = ctx.params.id;
      if(!id) throw Error('no id');

      const res = await db.update(id, ctx.request.body ?? {});

      // 修改更新者
      await db.update(id, { last_modified_account_id: ctx.session.userInfo.id as number }, true);
      // 修改成功后的回调
      if(handlers.afterUpdate) {
        await handlers.afterUpdate(ctx, id);
      }

      ctx.body = <Response>{
        code: 200,
        data: null,
      };
    })
    // 删除
    .delete('/list/:id/', async (ctx) => {
      const id: string = ctx.params.id;
      if(!id) throw Error('no id');

      const res = await db.delete(id, { fullDelete: true });
      if(!res.affectedRows) throw Error('no such id');

      // 删除成功后的回调
      if(handlers.afterDelete) {
        await handlers.afterDelete(ctx, id);
      }

      ctx.body = <Response>{
        code: 200,
        data: null,
      };
    });

  return { router, baseUrl: `/${db.tableName}` };
};
