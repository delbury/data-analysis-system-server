import { createRouter } from '../RESTfulBase';
import { DB } from '../../db/mysql';
import { WorkbenchTable } from '../../../types/tables';

const db = new DB<WorkbenchTable>('workbench', {
  insertDataValidator: (data) => {
    // 数据校验
  },
});

const router = createRouter(db);

export default {
  router,
  baseUrl: '/workbench',
};
