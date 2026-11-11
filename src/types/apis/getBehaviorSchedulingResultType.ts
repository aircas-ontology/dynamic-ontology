/** 行为调度执行结果查询参数。 */
export interface GetBehaviorSchedulingResultParams {
  id: number;
  type: "TASK" | "RULE";
  pageNum?: number;
  pageSize?: number;
}

/** 单条执行结果，接口未声明字段必填。 */
export interface BehaviorSchedulingResultRecord {
  msg?: string;
  executeResult?: string;
  triggerTime?: string;
  requestParam?: string;
  completeTime?: string;
  taskStatus?: "PENDING" | "FAILED" | "COMPLETED";
}

/** 调度执行结果分页数据。 */
export interface GetBehaviorSchedulingResultData {
  records: BehaviorSchedulingResultRecord[];
  total: number;
  size: number;
  current: number;
  /** 已弃用，不依赖。 */
  pages?: number;
}
