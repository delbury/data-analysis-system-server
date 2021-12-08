export interface Response<T = any> {
  code: number;
  msg?: string;
  data: T;
}

// 返回列表
export type ResponseList<T extends {} = any> = Response<{
  total: number;
  list: T[];
}>
