import type { CreateBehaviorScheduleParams } from "./createBehaviorScheduleType";

/** 周期调度编辑请求，复用创建参数并增加目标调度ID。 */
export interface UpdateBehaviorSchedulingParams extends CreateBehaviorScheduleParams {
  /** 待编辑调度ID。 */
  id: number;
}
