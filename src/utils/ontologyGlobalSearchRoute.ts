import type { OntologyGlobalSearchItem } from "@/types";
import type { RouteLocationRaw } from "vue-router";

/**
 * @description 将全局检索结果解析为可跳转的命名路由；本期仅支持空间与对象。
 * @param item 检索结果条目。
 * @returns 路由位置；不支持的类型或缺少 spaceId 时返回 null。
 */
export function resolveOntologyGlobalSearchRoute(item: OntologyGlobalSearchItem): RouteLocationRaw | null {
  if (item.spaceId === undefined || item.spaceId === null || !Number.isFinite(item.spaceId)) {
    return null;
  }
  const spaceId = String(item.spaceId);
  if (item.type === "空间") {
    return {
      name: "OntologySpaceManagementDetailOverview",
      params: { spaceId },
    };
  }
  if (item.type === "对象") {
    return {
      name: "OntologySpaceManagementDetailObject",
      params: { spaceId },
    };
  }
  return null;
}
