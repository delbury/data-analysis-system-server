import Router from 'koa-router';

import workbench from './workbench';
import teamgroup from './teamgroup';
import staff from './staff';
import role from './role';
import permission from './permission';
import account from './account';
import trainer from './trainer';
import globalconfig from './globalconfig';
// 权限相关
import auth from './auth';
// 环境相关
import env from './env';

// api 路径前缀
const BASE_PATH = '/api';

// auth 路径
export const AUTH_PATH_REG = new RegExp(`${BASE_PATH}${auth.baseUrl}/`, 'i');
// env 路径
export const ENV_PATH_REG = new RegExp(`${BASE_PATH}${env.baseUrl}/`, 'i');

// 所有导入路由数组
const controllers: { baseUrl: string, router: Router }[] = [
  workbench,
  teamgroup,
  staff,
  role,
  permission,
  account,
  auth,
  env,
  trainer,
  globalconfig,
];

const router = new Router();
controllers.forEach(c => router.use(BASE_PATH + c.baseUrl, c.router.routes()));

export default router;
