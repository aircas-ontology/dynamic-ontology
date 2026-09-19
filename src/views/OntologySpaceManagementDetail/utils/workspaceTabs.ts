import type { ManagementWorkspaceTab, OntologySpaceDetailRouteName } from "@/types";

const TAB_ROUTE_NAMES: Record<ManagementWorkspaceTab, OntologySpaceDetailRouteName> = {
  overview: "OntologySpaceManagementDetailOverview",
  object: "OntologySpaceManagementDetailObject",
  relation: "OntologySpaceManagementDetailRelation",
  "function-operator": "OntologySpaceManagementDetailFunctionOperator",
  behavior: "OntologySpaceManagementDetailBehavior",
  "behavior-schedule": "OntologySpaceManagementDetailBehaviorSchedule",
};

const ROUTE_TAB_IDS = Object.fromEntries(
  Object.entries(TAB_ROUTE_NAMES).map(([tab, routeName]) => [routeName, tab]),
) as Record<OntologySpaceDetailRouteName, ManagementWorkspaceTab>;

export const AVAILABLE_WORKSPACE_TABS: readonly ManagementWorkspaceTab[] = [
  "overview",
  "object",
  "relation",
  "function-operator",
  "behavior",
  "behavior-schedule",
];

export function routeNameForTab(tab: ManagementWorkspaceTab): OntologySpaceDetailRouteName {
  return TAB_ROUTE_NAMES[tab];
}

export function tabFromRouteName(name: string | symbol | null | undefined): ManagementWorkspaceTab | null {
  if (typeof name !== "string") return null;
  return ROUTE_TAB_IDS[name as OntologySpaceDetailRouteName] ?? null;
}
