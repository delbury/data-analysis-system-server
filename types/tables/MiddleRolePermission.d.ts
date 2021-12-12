import { CommonTable } from './Common';

export interface MiddleRolePermissionTable extends CommonTable {
  role_id: number;
  permission_id: number;
  // 主键
  id: number;
  // 是否已删除
  is_delete: number;
  // 是否是系统创建的数据
  is_system: number;
  // 创建时间
  created_time: string;
  // 最后一次修改时间
  last_modified_time: string;
  // 创建者
  creater_id: number;
  // 最后一次修改者
  last_modified_account_id: number;
}
