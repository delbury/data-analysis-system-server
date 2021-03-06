import { createRouter } from '../RESTfulBase';
import { DB } from '~/db/mysql';
import { StaffTable } from '~types/tables';

const db = new DB<StaffTable>('staff', {});

export default createRouter(db);
