/** 启用和停用行为调度的路径参数。 */
export interface ChangeBehaviorSchedulingStatusParams {
  /** 周期任务或规则调度。 */
  type: "TASK" | "RULE";
  /** 调度ID。 */
  id: number;
}
