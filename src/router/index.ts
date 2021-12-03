import Router from 'koa-router';
import workbench from './workbench';
import teamgroup from './teamgroup';
import staff from './staff';
import role from './role';

import test from './test';

const BASE_PATH = '/api';

// 所有导入路由数组
const controllers: { baseUrl: string, router: Router }[] = [
  workbench,
  teamgroup,
  staff,
  role,
];

const router = new Router();
controllers.forEach(c => router.use(BASE_PATH + c.baseUrl, c.router.routes()));
// 测试用
router.use(test.routes());

export default router;
