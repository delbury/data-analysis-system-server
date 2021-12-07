import { createRouter } from '../RESTfulBase';
import { DB } from '../../db/mysql';
import { TeamGroupTable } from '../../../types/tables';

const db = new DB<TeamGroupTable>('staff', {});

export default createRouter(db);
