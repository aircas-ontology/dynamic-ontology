import type { RouteLocationNormalizedLoaded } from "vue-router";

/**
 * @description 解析关系工作台使用的空间 id：优先路由 params.spaceId（空间详情），否则 query.spaceId（对象详情）。
 * @param route 当前路由。
 * @returns 去空白后的空间 id；均无时为空串。
 */
export function resolveRelationSpaceId(route: RouteLocationNormalizedLoaded): string {
  const fromParams = String(route.params.spaceId || "").trim();
  if (fromParams) return fromParams;
  const fromQuery = route.query.spaceId;
  return typeof fromQuery === "string" ? fromQuery.trim() : "";
}

/**
 * @description 解析对象详情关系 Tab 的默认源筛选种子：优先匹配 options 中的 objectId，其次 objectName 对应 label，再回退名称或 id。
 * @param objectOptions 关系对象下拉选项。
 * @param objectId 路由对象 id。
 * @param objectName 路由 query 中的对象名称。
 * @returns 可传给 applyRelationFilter 的种子值；无法解析时为空串。
 */
export function resolveObjectRelationFilterSeed(
  objectOptions: ReadonlyArray<{ value: string; label: string }>,
  objectId: string,
  objectName: string,
): string {
  const id = objectId.trim();
  const name = objectName.trim();
  if (id && objectOptions.some((item) => item.value === id)) return id;
  if (name) {
    const byLabel = objectOptions.find((item) => item.label.trim() === name);
    if (byLabel) return byLabel.value;
    return name;
  }
  return id;
}
