import { createRouter } from '../RESTfulBase';
import { DB } from '~/db/mysql';
import { TeamGroupTable } from '~types/tables';

const db = new DB<TeamGroupTable>('team_group', {});

export default createRouter(db);
