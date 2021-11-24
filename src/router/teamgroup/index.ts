import { createRouter } from '../RESTfulBase';
import { DB } from '../../db/mysql';
import { TeamGroupTable } from '../../../types/tables';

const db = new DB<TeamGroupTable>('team_group', {});

const router = createRouter(db);

export default {
  router,
  baseUrl: '/teamgroup',
};
