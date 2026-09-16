import type { OntologySpaceOverview } from "@/types";

/** 确定性空间统计样例；函数算子和调度数量为演示值。 */
export const ontologySpaceManagementDetailMock: OntologySpaceOverview[] = [
  { spaceId: "army", counts: { object: 18, relation: 36, "function-operator": 8, behavior: 12, "behavior-schedule": 3 }, availableTabs: ["object", "relation", "function-operator", "behavior", "behavior-schedule"] },
  { spaceId: "navy", counts: { object: 22, relation: 48, "function-operator": 12, behavior: 15, "behavior-schedule": 5 }, availableTabs: ["object", "relation", "function-operator", "behavior", "behavior-schedule"] },
  { spaceId: "air-force", counts: { object: 20, relation: 40, "function-operator": 10, behavior: 12, "behavior-schedule": 4 }, availableTabs: ["object", "relation", "function-operator", "behavior", "behavior-schedule"] },
  { spaceId: "rocket-force", counts: { object: 14, relation: 28, "function-operator": 7, behavior: 11, "behavior-schedule": 2 }, availableTabs: ["object", "relation", "function-operator", "behavior", "behavior-schedule"] },
  { spaceId: "space-force", counts: { object: 12, relation: 24, "function-operator": 6, behavior: 9, "behavior-schedule": 0 }, availableTabs: ["object", "relation", "function-operator", "behavior", "behavior-schedule"] },
  { spaceId: "environment", counts: { object: 20, relation: 38, "function-operator": 9, behavior: 14, "behavior-schedule": 3 }, availableTabs: ["object", "relation", "function-operator", "behavior", "behavior-schedule"] },
];
