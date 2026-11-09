import type { EntityBrowsingRouteName, EntityBrowsingTab, ManagementWorkspaceTab } from "@/types";

const TAB_ROUTE_NAMES: Record<EntityBrowsingTab, EntityBrowsingRouteName> = {
  object: "EntityBrowsingObject",
  relation: "EntityBrowsingRelation",
  "function-operator": "EntityBrowsingFunctionOperator",
  behavior: "EntityBrowsingBehavior",
  "behavior-schedule": "EntityBrowsingBehaviorSchedule",
};

const ROUTE_TAB_IDS = Object.fromEntries(Object.entries(TAB_ROUTE_NAMES).map(([tab, routeName]) => [routeName, tab])) as Record<
  EntityBrowsingRouteName,
  EntityBrowsingTab
>;

/** 实体浏览可用工作区 Tab（不含行为调度）。 */
export const AVAILABLE_ENTITY_BROWSING_TABS: readonly ManagementWorkspaceTab[] = ["object", "relation", "function-operator", "behavior"];

/**
 * @description 将工作区 Tab 映射为实体浏览路由名。
 * @param tab 工作区 Tab。
 * @returns 对应路由 name。
 */
export function routeNameForEntityBrowseTab(tab: ManagementWorkspaceTab): EntityBrowsingRouteName {
  return TAB_ROUTE_NAMES[tab];
}

/**
 * @description 从路由 name 解析实体浏览工作区 Tab。
 * @param name 当前路由 name。
 * @returns Tab；无法识别时返回 null。
 */
export function tabFromEntityBrowseRouteName(name: string | symbol | null | undefined): ManagementWorkspaceTab | null {
  if (typeof name !== "string") return null;
  return ROUTE_TAB_IDS[name as EntityBrowsingRouteName] ?? null;
}
