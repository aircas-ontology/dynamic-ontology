import type { RouteLocationNormalizedLoaded } from "vue-router";

/**
 * @description 解析行为工作台使用的空间 id：优先路由 params.spaceId（空间详情），否则 query.spaceId（对象详情）。
 * @param route 当前路由。
 * @returns 去空白后的空间 id，缺失时为空串。
 */
export function resolveBehaviorSpaceId(route: RouteLocationNormalizedLoaded): string {
  const fromParams = String(route.params.spaceId || "").trim();
  if (fromParams) return fromParams;
  const fromQuery = route.query.spaceId;
  return typeof fromQuery === "string" ? fromQuery.trim() : "";
}

/**
 * @description 解析对象详情行为页用于列表筛选与创建锁定的对象唯一标识；空间行为页返回空串。
 * @param route 当前路由。
 * @returns `params.objectId` 去空白后的值；非对象详情页为空串。
 */
export function resolveBehaviorOntologyId(route: RouteLocationNormalizedLoaded): string {
  return String(route.params.objectId || "").trim();
}
