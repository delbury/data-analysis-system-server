import { createRouter } from '~/router/RESTfulBase';
import { DB } from '~/db/mysql';
import { WorkbenchTable } from '~types/tables';
import { setError, setResult } from '~/util';

const db = new DB<WorkbenchTable>('workbench', {
  insertDataValidator: (data) => {
    // 数据校验
  },
});

const router = createRouter(db, {
  // 编辑一次后，变更为完成
  // additionalUpdate: (ctx, data) => ({
  //   status: 2,
  // }),
});

// 生成下一个项目编号
router.router.get('/projectcode', async (ctx) => {
  const project = ctx.query.project;
  const code = ctx.query.code;
  if(!project || !code || typeof project !== 'string' || typeof code !== 'string') {
    setError(ctx);
  } else {
    const year = (new Date).getFullYear();
    const count = await db.count(db.resolveFilters({ train_project_name: project }, { type: 'equal', hasPrefix: false }).resolved);
    const formatedCount = (count + 1).toString().padStart(3, '0');
    const fullCode = `${year}-YY1-${code}-${formatedCount}`;
    setResult(ctx, fullCode);
  }
});

// 变更为完成状态
router.router.post('/complete', async (ctx) => {
  const { id } = ctx.request.body;
  console.log(id);
  if(!id || (typeof id !== 'number')) {
    setError(ctx);
  } else {
    await db.update(id, { status: 2 }, { force: true });
    setResult(ctx);
  }
});

export default router;
