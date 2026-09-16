/** 空间内管理工作区 Tab 标识。 */
export type ManagementWorkspaceTab =
  | "overview"
  | "object"
  | "relation"
  | "function-operator"
  | "behavior"
  | "behavior-schedule";

export type OntologySpaceDetailRouteName =
  | "OntologySpaceManagementDetailOverview"
  | "OntologySpaceManagementDetailObject"
  | "OntologySpaceManagementDetailRelation"
  | "OntologySpaceManagementDetailFunctionOperator"
  | "OntologySpaceManagementDetailBehavior"
  | "OntologySpaceManagementDetailBehaviorSchedule";

export type OntologySpaceDetailLoadStatus = "loading" | "ready" | "empty" | "error";
