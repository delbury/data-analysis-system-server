import { DB } from '~/db/mysql';
import { GlobalConfigTable } from '~types/tables';

const db = new DB<GlobalConfigTable>('global_config', {});

export default db;

export const getConfig = (key: string) => {
  return db.search({ all: 1 }, db.resolveFilters({ key }, { type: 'equal' }).resolved);
};
