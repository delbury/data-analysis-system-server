import Router from 'koa-router';
import { DB } from '~/db/mysql';
import Koa from 'koa';
import { CommonTable } from '~types/tables/Common';
import { setError, setResult } from '~/util';

interface Hanlders<T = any> {
  beforeInsert?: (ctx: Koa.ParameterizedContext, data: T) => Promise<string | void>;
  afterInseart?: (ctx: Koa.ParameterizedContext, id: string) => void;
  afterUpdate?: (ctx: Koa.ParameterizedContext, id: string) => void;
  afterDelete?: (ctx: Koa.ParameterizedContext, id: string) => void;
  additionalUpdate?: (ctx: Koa.ParameterizedContext, data: T) => Partial<T>;
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

export const createRouter = <T extends CommonTable>(db: DB<T>, handlers: Hanlders<T> = {}) => {
  const router = new Router();

  router
    // 查询
    .get('/list', async (ctx) => {
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
        }, { type: 'auto' }),
        { filterDeleted: true }
      );
      setResult(ctx, {
        total: res.total,
        list: res.list,
      });
    })
    // 详情
    .get('/list/:id', async (ctx) => {
      const id: string = ctx.params.id;
      if(!id) throw Error('no id');

      const res = await db.detail(id, db.resolveFilters(ctx.session.datasMap[db.tableName] ?? {}));
      if(res) {
        setResult(ctx, res);
      } else {
        setError(ctx, 400, NODATA_OR_NOAUTH_MSG);
      }
    })
    // 添加
    .post('/list', async (ctx) => {
      const fieldsMap = ctx.session.datasMap[db.tableName];
      const data = ctx.request.body ?? {};
      if(isFieldValueValid(data, fieldsMap)) {
        if(handlers.beforeInsert) {
          const checkRes = await handlers.beforeInsert(ctx, data);
          if(checkRes) {
            setError(ctx, 400, checkRes);
            return;
          }
        }

        const res = await db.insert({
          ...data,
          // 设置创建者
          creater_id: ctx.session.userInfo.id as number,
        });

        // 添加成功后的回调
        if(handlers.afterInseart) {
          await handlers.afterInseart(ctx, res.insertId as string);
        }

        setResult(ctx);
      } else {
        setError(ctx, 400, NOAUTH_MSG);
      }

    })
    // 修改
    .put('/list/:id', async (ctx) => {
      const id: string = ctx.params.id;
      if(!id) throw Error('no id');

      const fieldsMap = ctx.session.datasMap[db.tableName];
      const data = ctx.request.body ?? {};
      if(isFieldValueValid(data, fieldsMap)) {
        const res = await db.update(
          id,
          ctx.request.body ?? {},
          { force: false },
        );

        // 修改更新者
        await db.update(
          id,
          {
            last_modified_account_id: ctx.session.userInfo.id as number,
            ...(handlers.additionalUpdate ? handlers.additionalUpdate(ctx, data) : {}),
          },
          { force: true },
        );

        // 修改成功后的回调
        if(handlers.afterUpdate) {
          await handlers.afterUpdate(ctx, id);
        }

        setResult(ctx);
      } else {
        setError(ctx, 400, NOAUTH_MSG);
      }
    })
    // 删除
    .delete('/list/:id', async (ctx) => {
      const id: string = ctx.params.id;
      if(!id) throw Error('no id');

      // 物理删除
      // const res = await db.delete(
      //   id,
      //   { fullDelete: true },
      //   db.resolveFilters(ctx.session.datasMap[db.tableName] ?? {}, void 0, false)
      // );
      // 逻辑删除
      const res = await db.softDelete(
        id,
        db.resolveFilters(ctx.session.datasMap[db.tableName] ?? {}, { type: 'equal', hasPrefix: false })
      );

      if(!res.affectedRows) {
        setError(ctx, 400, NODATA_OR_NOAUTH_MSG);
      } else {
        // 删除成功后的回调
        if(handlers.afterDelete) {
          await handlers.afterDelete(ctx, id);
        }

        setResult(ctx);
      }
    });

  return { router, baseUrl: `/${db.tableName}` };
};
