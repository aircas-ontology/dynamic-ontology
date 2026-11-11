/** 调度列表分页查询参数。 */
export interface ListBehaviorSchedulingParams {
  /** 调度名称，模糊匹配。 */
  name?: string;
  /** 调度类型，不传时查询全部。 */
  type?: "TASK" | "RULE";
  pageNum?: number;
  pageSize?: number;
}

/** 调度列表记录；不包含执行配置详情。 */
export interface ListBehaviorSchedulingRecord {
  id: number;
  ontologyName?: string;
  ontologyIdentifier: string;
  actionApi: string;
  actionName: string;
  schedulingName: string;
  /** 接口返回的创建时间，按原值展示。 */
  createTime?: string | null;
  description: string;
  type: "TASK" | "RULE";
  status: "START" | "STOP";
}

/** 调度列表分页响应，pages 已在 OpenAPI 中标记弃用。 */
export interface ListBehaviorSchedulingData {
  records: ListBehaviorSchedulingRecord[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}
