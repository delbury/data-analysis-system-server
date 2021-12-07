import { createRouter } from '../RESTfulBase';
import { DB } from '../../db/mysql';
import { RoleTable } from '../../../types/tables';

const db = new DB<RoleTable>('role', {});

export default createRouter(db);
