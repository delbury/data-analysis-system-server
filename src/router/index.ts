import Router from 'koa-router';
import workbench from './workbench';
import test from './test';

// 所有导入路由数组
const controllers: { baseUrl: string, router: Router }[] = [
  workbench,
];

const router = new Router();
controllers.forEach(c => router.use(c.baseUrl, c.router.routes()));
// 测试用
router.use(test.routes());

export default router;
