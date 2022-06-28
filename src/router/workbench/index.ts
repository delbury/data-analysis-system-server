import { createRouter } from '~/router/RESTfulBase';
import { DB } from '~/db/mysql';
import { WorkbenchTable } from '~types/tables';
import { setError, setResult } from '~/util';
import { getConfig } from '../globalconfig/db';
import pick from 'lodash/pick';

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
    const totalConfig = await getConfig('project_code_offset');
    const codeConfig = await getConfig('project_code_offset_' + code);
    const offset = (+totalConfig.list[0]?.value || 0) + (+codeConfig.list[0]?.value || 0);

    const year = (new Date).getFullYear();
    const count = await db.count(db.resolveFilters({ train_project_name: project }, { type: 'equal', hasPrefix: false }).resolved);
    const formatedCount = (count + offset + 1).toString().padStart(3, '0');
    const fullCode = `${year}-YY1-${code}-${formatedCount}`;
    setResult(ctx, fullCode);
  }
});

// 修改培训完成情况，并变更为完成状态
router.router.put('/:id/complete', async (ctx) => {
  const id = +(ctx.params.id);
  const data = pick(ctx.request.body ?? {}, [
    'train_effect_count',
    'student_evaluation_score',
    'maintainer_evaluation_score',
    'effect_evaluation_score',
    'course_pay',
    'trained_count_manage',
    'trained_count_key',
    'trained_count_product',
    'trained_count_new',
    'trained_count_work',
    'trained_count_total',
  ]);

  if(!id || (typeof id !== 'number')) {
    setError(ctx);
  } else {
    await db.update(id, { status: 2, ...data }, { force: true });
    setResult(ctx);
  }
});

// 编辑参训人员
router.router.put('/:id/staffs', async (ctx) => {
  const id = +(ctx.params.id);
  const staffs = ctx.request.body?.trained_staffs;
  if(
    !id ||
    (typeof id !== 'number') ||
    !staffs ||
    !Array.isArray(staffs) ||
    staffs.some(it => typeof it !== 'string' && typeof it !== 'number')
  ) {
    setError(ctx);
  } else {
    await db.update(id, { trained_staffs: staffs });
    setResult(ctx);
  }
});

export default router;
