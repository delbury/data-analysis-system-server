import { createRouter } from '../RESTfulBase';
import { DB } from '../../db/mysql';
import { WorkbenchTable } from '../../../types/tables';

const db = new DB<WorkbenchTable>('workbench', {
  // includeFields: [
  //   'id',
  //   'created_time',
  // ],
});

const router = createRouter(db);

export default {
  router,
  baseUrl: '/workbench',
};
