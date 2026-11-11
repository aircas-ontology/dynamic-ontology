/** 周期调度任务配置。 */
export interface CreateBehaviorScheduleTask {
  /** 页面周期类型对应的接口枚举。 */
  periodType: "DAILY" | "WEEKLY" | "MONTHLY" | "CRON";
  taskCronExpression: string;
  /** 完整行为执行参数的 JSON 字符串。 */
  entityJson: string;
}

/** 行为调度创建参数。 */
export interface CreateBehaviorScheduleParams {
  /** 应用行为可省略，由后端从 linkMapping 推导。 */
  ontologyIdentifier?: string;
  actionApi: string;
  name: string;
  description: string;
  type: "TASK";
  task: CreateBehaviorScheduleTask;
}
