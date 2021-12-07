/**
 * 中间关系表
 */

import { DB } from '../db/mysql';
import { MiddleRolePermissionTable } from '../../types/tables';

export const dbMiddleRolePermission = new DB<MiddleRolePermissionTable>('middle_role_permission', {});
