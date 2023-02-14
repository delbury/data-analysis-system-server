import { createRouter } from '~/router/RESTfulBase';
import { DB } from '~/db/mysql';
import { WorkbenchTable } from '~types/tables';
import { setError, setResult } from '~/util';
import { getConfig } from '../globalconfig/db';
import pick from 'lodash/pick';

// 项目名称/code 映射
const PROJECT_NAME_CODES = [
  // { name: '安全类培训', code: 116 },
  // { name: '车间综合管理类培训', code: 117 },
  // { name: '继续教育学时学分制培训', code: 118 },
  // { name: '综合监控专业知识培训', code: 119 },
  // { name: '消防专业知识培训', code: 120 },
  // { name: '屏蔽门专业知识培训', code: 121 },
  // { name: '电扶梯专业知识培训', code: 122 },
  // { name: '风水电专业知识培训', code: 123 },
  // { name: 'AFC专业知识培训', code: 124 },

  // 2023 新课程序列
  { name: '安全综合培训', code: 123 },
  { name: '继续教育学时学分制培训', code: 124 },
  { name: '【必知必会】综合监控专业知识及技能培训', code: 125 },
  { name: '【核心技能】综合监控专业知识及技能培训', code: 126 },
  { name: '【必知必会】消防专业知识及技能培训', code: 127 },
  { name: '【核心技能】消防专业知识及技能培训', code: 128 },
  { name: '【必知必会】屏蔽门专业知识及技能培训', code: 129 },
  { name: '【核心技能】屏蔽门专业知识及技能培训', code: 130 },
  { name: '【必知必会】电扶梯专业知识及技能培训', code: 131 },
  { name: '【核心技能】电扶梯专业知识及技能培训', code: 132 },
  { name: '【必知必会】风水电专业知识及技能培训', code: 133 },
  { name: '【核心技能】风水电专业知识及技能培训', code: 134 },
  { name: '【必知必会】AFC专业知识及技能培训', code: 135 },
  { name: '【核心技能】AFC专业知识及技能培训', code: 136 },
  { name: '轨道设备脱落风险识别与处理', code: 137 },
  { name: '土建设备脱落风险识别与处理', code: 138 },
  { name: '网络安全隐患排查处置培训', code: 139 },
];

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
  resolveInseartData: async (ctx, data) => {
    // 自动生成 project_code
    const projectName = data.train_project_name;
    const cfg = PROJECT_NAME_CODES.find(it => it.name === projectName);
    if(!cfg) {
      throw new Error('非法的项目名称');
    }
    const code = cfg.code;

    // 编号的起始偏移值
    const codeConfig = await getConfig('project_code_offset_' + code);
    let offset = +codeConfig.list[0]?.value || 0;
    if(!offset) {
      // 如果没有具体的编号偏移值，则去查询全局的偏移值
      const totalConfig = await getConfig('project_code_offset');
      offset = +totalConfig.list[0]?.value || 0;
    }

    // 当前年
    const year = (new Date).getFullYear();

    // 数据库已有的数据
    const dbResult = await db.runSql(
      `SELECT project_code FROM ${db.tableName} WHERE train_project_name='${projectName}'` +
      ` AND project_code LIKE '${year}-YY1-${code}-___';`
    );
    const countList = JSON.parse(JSON.stringify(dbResult));
    const countSet = new Set(countList.map((it: any) => {
      const matched = (it.project_code as string).match(/-(\d*)$/)?.[1];
      return +matched;
    }));

    // 得到当前不重复的 count
    do {
      offset++;
    } while(countSet.has(offset));
    const formatedCount = offset.toString().padStart(3, '0');
    const fullCode = `${year}-YY1-${code}-${formatedCount}`;

    data.project_code = fullCode;
    return data;
  },
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
