export interface TeamGroupTable {
  name: string;
  // 1：车间，2：委外
  type: number;
  remark: string;
  // 主键
  id: number;
  // 是否已删除
  is_delete: number;
  // 创建时间
  created_time: string;
  creater_id: number;
}
