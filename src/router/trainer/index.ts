import { createRouter } from '../RESTfulBase';
import { DB } from '~/db/mysql';
import { TrainerTable } from '~types/tables';

const db = new DB<TrainerTable>('trainer', {});

export default createRouter(db);
