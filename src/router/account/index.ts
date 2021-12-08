import { createRouter } from '../RESTfulBase';
import { DB } from '../../db/mysql';
import { AccountTable } from '../../../types/tables';

export const db = new DB<AccountTable>('account', {});

export default createRouter(db);
