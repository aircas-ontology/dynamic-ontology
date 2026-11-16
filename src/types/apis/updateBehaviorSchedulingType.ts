import type { CreateBehaviorScheduleParams } from "./createBehaviorScheduleType";

/** 周期或规则调度编辑请求，按 type 复用完整创建参数并增加目标调度ID。 */
export type UpdateBehaviorSchedulingParams = CreateBehaviorScheduleParams & {
  /** 待编辑调度ID。 */
  id: number;
};
