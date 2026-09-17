import type { OntologyObjectDetailRouteName, OntologyObjectDetailTab } from "@/types";

const TAB_ROUTE_NAMES: Record<OntologyObjectDetailTab, OntologyObjectDetailRouteName> = {
  object: "OntologyObjectDetailObject",
  attribute: "OntologyObjectDetailAttribute",
  relation: "OntologyObjectDetailRelation",
  behavior: "OntologyObjectDetailBehavior",
};

const ROUTE_TAB_IDS = Object.fromEntries(Object.entries(TAB_ROUTE_NAMES).map(([tab, routeName]) => [routeName, tab])) as Record<
  OntologyObjectDetailRouteName,
  OntologyObjectDetailTab
>;

export const AVAILABLE_OBJECT_DETAIL_TABS: readonly OntologyObjectDetailTab[] = ["object", "attribute", "relation", "behavior"];

/**
 * @description 根据 Tab 标识解析对应的路由名称。
 * @param tab Tab 标识。
 * @returns 路由名称。
 */
export function routeNameForObjectDetailTab(tab: OntologyObjectDetailTab): OntologyObjectDetailRouteName {
  return TAB_ROUTE_NAMES[tab];
}

/**
 * @description 根据路由名称反解 Tab 标识；非本页面路由返回 null。
 * @param name 当前路由名称。
 * @returns Tab 标识或 null。
 */
export function objectDetailTabFromRouteName(name: string | symbol | null | undefined): OntologyObjectDetailTab | null {
  if (typeof name !== "string") return null;
  return ROUTE_TAB_IDS[name as OntologyObjectDetailRouteName] ?? null;
}
