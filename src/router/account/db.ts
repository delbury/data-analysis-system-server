import { AccountTable } from '~types/tables';
import { DB } from '~/db/mysql';

export const db = new DB<AccountTable>('account', {});
