import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { SpaceRelationObjectOption } from "@/types";

/**
 * @description 解析关系工作台使用的空间 id：优先路由 params.spaceId（空间详情），否则 query.spaceId（对象详情）。
 * @param route 当前路由。
 * @returns 去空白后的空间 id，缺失时为空串。
 */
export function resolveRelationSpaceId(route: RouteLocationNormalizedLoaded): string {
  const fromParams = String(route.params.spaceId || "").trim();
  if (fromParams) return fromParams;
  const fromQuery = route.query.spaceId;
  return typeof fromQuery === "string" ? fromQuery.trim() : "";
}

/**
 * @description 在对象详情关系 Tab 下，根据 objectId / objectName 解析默认源筛选种子（优先选项 value）。
 * @param route 当前路由。
 * @param objectOptions 关系对象下拉选项。
 * @returns 可传入 applyRelationFilter 的种子值；非对象详情或无法解析时返回空串。
 */
export function resolveObjectRelationFilterSeed(route: RouteLocationNormalizedLoaded, objectOptions: SpaceRelationObjectOption[]): string {
  const objectId = String(route.params.objectId || "").trim();
  if (!objectId) return "";

  const byId = objectOptions.find((item) => item.value === objectId);
  if (byId) return byId.value;

  const objectName = typeof route.query.objectName === "string" ? route.query.objectName.trim() : "";
  if (objectName) {
    const byName = objectOptions.find((item) => item.label === objectName);
    if (byName) return byName.value;
    return objectName;
  }

  return objectId;
}
