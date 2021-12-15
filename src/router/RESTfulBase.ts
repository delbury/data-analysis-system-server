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

const NODATA_OR_NOAUTH_MSG = '没有该数据或无权限';
const NOAUTH_MSG = '没有操作该数据权限';

// 新建或修改时，判断传入的值是否符合表的数据权限规则
const isFieldValueValid = (data: Record<string, string | string[]>, fieldsMap?: Record<string, string[]>): boolean => {
  if(!fieldsMap) return true;
  for(const field in fieldsMap) {
    if(field in data) {
      // 当前传入的值
      const dataVal = data[field];
      if(dataVal == void 0 || dataVal == '') continue;

      // 权限的值集合
      const pset = new Set(fieldsMap[field]);
      if(Array.isArray(dataVal)) {
        if(dataVal.some(it => !pset.has(`${it}`))) return false;
      } else {
        return pset.has(`${dataVal}`);
      }
    }
  }
  return true;
};

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
        db.resolveFilters({
          ...filters,
          // 数据权限
          ...(ctx.session.datasMap[db.tableName] ?? {}),
        }, 'auto'),
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

      const res = await db.detail(id, db.resolveFilters(ctx.session.datasMap[db.tableName] ?? {}));
      if(res) {
        ctx.body = <Response>{
          code: 200,
          data: res,
        };
      } else {
        ctx.status = 400;
        ctx.body = <Response>{
          code: 400,
          data: null,
          msg: NODATA_OR_NOAUTH_MSG,
        };
      }
    })
    // 添加
    .post('/list/', async (ctx) => {
      const fieldsMap = ctx.session.datasMap[db.tableName];
      const data = ctx.request.body ?? {};
      if(isFieldValueValid(data, fieldsMap)) {
        const res = await db.insert({
          ...data,
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
      } else {
        ctx.status = 400;
        ctx.body = <Response>{
          code: 400,
          data: null,
          msg: NOAUTH_MSG,
        };
      }

    })
    // 修改
    .put('/list/:id/', async (ctx) => {
      const id: string = ctx.params.id;
      if(!id) throw Error('no id');

      const fieldsMap = ctx.session.datasMap[db.tableName];
      const data = ctx.request.body ?? {};
      if(isFieldValueValid(data, fieldsMap)) {
        const res = await db.update(
          id,
          ctx.request.body ?? {},
          false,
        );

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
      } else {
        ctx.status = 400;
        ctx.body = <Response>{
          code: 400,
          data: null,
          msg: NOAUTH_MSG,
        };
      }
    })
    // 删除
    .delete('/list/:id/', async (ctx) => {
      const id: string = ctx.params.id;
      if(!id) throw Error('no id');

      const res = await db.delete(
        id,
        { fullDelete: true },
        db.resolveFilters(ctx.session.datasMap[db.tableName] ?? {}, void 0, false)
      );

      if(!res.affectedRows) {
        ctx.status = 400;
        ctx.body = <Response>{
          code: 400,
          data: null,
          msg: NODATA_OR_NOAUTH_MSG,
        };
      } else {
        // 删除成功后的回调
        if(handlers.afterDelete) {
          await handlers.afterDelete(ctx, id);
        }

        ctx.body = <Response>{
          code: 200,
          data: null,
        };
      }
    });

  return { router, baseUrl: `/${db.tableName}` };
};
