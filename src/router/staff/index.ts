import { createRouter } from '../RESTfulBase';
import { DB } from '~/db/mysql';
import { StaffTable } from '~types/tables';
import { setError, setResult } from '~/util';
import pick from 'lodash/pick';

const db = new DB<StaffTable>('staff', {});

const router = createRouter(db);

router.router.get('/safelist', async (ctx) => {
  const filters = { ...(ctx.query ?? {}) };
  const resultFilters = db.resolveFilters({
    ...filters,
  }, { type: 'like' });

  const res = await db.search(
    { all: 1 },
    resultFilters.resolved,
    { filterDeleted: true, unresolvedFilter: resultFilters.unresolved, useLike: true }
  );

  setResult(ctx, {
    ...res,
    // 脱敏
    list: res.list.map(it => pick(it, [
      'name', 'code', 'group_name', 'group_id', 'sex', 'id', 'group_type', 'level',
    ])),
  });
});

router.whiteList.push('/safelist');
export default router;
