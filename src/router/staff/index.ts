import { createRouter } from '../RESTfulBase';
import { DB } from '../../db/mysql';
import { TeamGroupTable } from '../../../types/tables';

const db = new DB<TeamGroupTable>('staff', {});

const router = createRouter(db);

export default {
  router,
  baseUrl: '/staff',
};
