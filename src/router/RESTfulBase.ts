import Router from 'koa-router';
import { DB } from '../db/mysql';

export const createRouter = <T>(db: DB<T>) => {
  const router = new Router();

  router
    // 查询
    .get('/list', async (ctx) => {
      const pageSize = Number(ctx.query.pageSize) || 20;
      const pageNumber = Number(ctx.query.pageNumber) || 1;

      const res = await db.search({ pageSize, pageNumber });
      ctx.body = {
        code: 200,
        data: {
          total: res.total,
          list: res.list,
        },
      };
    })
    // 添加
    .post('/list', async (ctx) => {
      const res = await db.insert(ctx.request.body ?? {});

      ctx.body = {
        code: 200,
      };
    })
    // 修改
    .put('/list/:id', async (ctx) => {
      const id: string = ctx.params.id;
      if(!id) throw Error('no id');

      const res = await db.update(id, ctx.request.body ?? {});

      ctx.body = {
        code: 200,
      };
    })
    // 删除
    .delete('/list/:id', async (ctx) => {
      const id: string = ctx.params.id;
      if(!id) throw Error('no id');

      const res = await db.delete(id);
      if(!res.affectedRows) throw Error('no such id');

      ctx.body = {
        code: 200,
      };
    });

  return router;
};
