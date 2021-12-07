export interface PermissionTable {
  name: string;
  // 页面路径
  path: string;
  // 权限列表
  tags: string[];
  remark: string;
  // 主键
  id: number;
  // 是否已删除
  is_delete: number;
  // 创建时间
  created_time: string;
  creater_id: number;
}
