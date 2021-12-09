import { createRouter } from '../RESTfulBase';
import { DB } from '~/db/mysql';
import { PermissionTable } from '~types/tables';

const db = new DB<PermissionTable>('permission', {});

export default createRouter(db);
