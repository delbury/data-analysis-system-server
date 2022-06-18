import { createRouter } from '../RESTfulBase';
import { DB } from '~/db/mysql';
import { GlobalConfigTable } from '~types/tables';

const db = new DB<GlobalConfigTable>('global_config', {});

export default createRouter(db);
