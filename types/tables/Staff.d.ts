import { CommonTable } from './Common';
import { TeamGroupTable } from './TeamGroup';

export interface StaffTable extends CommonTable {
  name: string;
  code: string;
  phone: string;
  group_id: number;
  group_name: TeamGroupTable['name'];
  group_type: TeamGroupTable['type'];
  // 职系序列
  job: string;
  // 是否取得上岗资格证书
  has_cert: number;
  remark: string;
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
