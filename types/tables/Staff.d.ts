export interface StaffTable {
  name: string;
  code: string;
  phone: string;
  group_id: number;
  // 职系序列
  job: string;
  // 是否取得上岗资格证书
  has_cert: number;
  remark: string;
  // 主键
  id: number;
  // 是否已删除
  is_delete: number;
  // 创建时间
  created_time: string;
  creater_id: number;
}
