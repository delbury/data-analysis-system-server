import { CommonTable } from './Common';
import { TeamGroupTable } from './TeamGroup';

export interface StaffTable extends CommonTable {
  name: string;
  // 性别，1：男，2：女
  sex: number;
  code: string;
  phone: string;
  group_id: number;
  group_name: TeamGroupTable['name'];
  group_type: TeamGroupTable['type'];
  // 岗位
  position: string;
  // 培训师星级，0：无，1：见习，2：一星，3：二星，4：三星
  level: number;
  // 是否取得上岗资格证书，0：否，1：是
  has_cert: number;
  // 入职时间
  join_date: string;
  // 离职时间
  quit_date: string;
  // 人员状态，0：离职，1：在职
  status: number;
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
