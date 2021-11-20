import Router from 'koa-router';
import workbench from './workbench';
import test from './test';

const BASE_PATH = '/api';

// 所有导入路由数组
const controllers: { baseUrl: string, router: Router }[] = [
  workbench,
];

const router = new Router();
controllers.forEach(c => router.use(BASE_PATH + c.baseUrl, c.router.routes()));
// 测试用
router.use(test.routes());

export default router;
