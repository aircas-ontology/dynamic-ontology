/** 周期调度任务配置。 */
export interface CreateBehaviorScheduleTask {
  taskCronExpression: string;
  /** 完整行为执行参数的 JSON 字符串。 */
  entityJson: string;
}

/** 行为调度创建参数。 */
export interface CreateBehaviorScheduleParams {
  ontologyIdentifier: string;
  actionApi: string;
  name: string;
  description: string;
  type: "TASK";
  task: CreateBehaviorScheduleTask;
}
