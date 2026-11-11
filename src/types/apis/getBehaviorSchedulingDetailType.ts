/** 调度详情查询参数。 */
export interface GetBehaviorSchedulingDetailParams {
  id: number;
  type: "TASK" | "RULE";
}
/** 周期任务详情。 */
export interface BehaviorSchedulingTaskDetail {
  /** 兼容历史记录，读取时校验枚举并安全降级。 */
  periodType?: string | null;
  taskCronExpression?: string;
  entityJson?: string;
}
/** 调度详情响应。 */
export interface GetBehaviorSchedulingDetailData {
  /** 优先读取的周期类型。 */
  periodType?: string | null;
  id: number;
  ontologyName?: string;
  ontologyIdentifier: string;
  actionApi: string;
  actionName: string;
  schedulingName: string;
  description: string;
  type: "TASK" | "RULE";
  status: "START" | "STOP";
  /** 实际接口返回的周期任务配置。 */
  taskVO?: BehaviorSchedulingTaskDetail;
  /** 兼容在线文档声明的历史字段。 */
  ruleVO?: BehaviorSchedulingTaskDetail;
}
