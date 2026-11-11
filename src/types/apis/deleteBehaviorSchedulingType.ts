/** 删除行为调度的路径参数。 */
export interface DeleteBehaviorSchedulingParams {
  /** 周期任务或规则调度。 */
  type: "TASK" | "RULE";
  /** 调度主键。 */
  id: number;
}
