import type { OntologyGlobalSearchItem } from "@/types";
import type { RouteLocationRaw } from "vue-router";

/**
 * @description 将全局检索结果解析为可跳转的命名路由；同步支持空间与关系分组。
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
  if (item.type === "关系分组") {
    return {
      name: "OntologySpaceManagementDetailRelation",
      params: { spaceId },
    };
  }
  return null;
}

/**
 * @description 将对象检索结果拼成对象详情「对象」Tab 路由（不再依赖 meta 接口）。
 * @param item 检索结果条目，需含 spaceId、spaceName、uniqueIdentifier、name。
 * @returns 对象详情对象 Tab 路由；缺少必要字段时返回 null。
 */
export function resolveOntologyGlobalSearchObjectRoute(item: OntologyGlobalSearchItem): RouteLocationRaw | null {
  if (item.type !== "对象") {
    return null;
  }
  if (item.spaceId === undefined || item.spaceId === null || !Number.isFinite(item.spaceId)) {
    return null;
  }
  const uniqueIdentifier = typeof item.uniqueIdentifier === "string" ? item.uniqueIdentifier.trim() : "";
  const spaceName = typeof item.spaceName === "string" ? item.spaceName.trim() : "";
  const objectName = typeof item.name === "string" ? item.name.trim() : "";
  if (!uniqueIdentifier || !spaceName || !objectName) {
    return null;
  }
  return {
    name: "OntologyObjectDetailObject",
    params: { objectId: uniqueIdentifier },
    query: {
      spaceId: String(item.spaceId),
      spaceName,
      objectName,
    },
  };
}

/**
 * @description 将属性检索结果拼成对象详情「属性」Tab 路由（不再依赖 meta 接口）。
 * @param item 检索结果条目，需含 spaceId、spaceName、ontologyName、ontologyUniqueIdentifier。
 * @returns 对象详情属性 Tab 路由；缺少必要字段时返回 null。
 */
export function resolveOntologyGlobalSearchPropertyRoute(item: OntologyGlobalSearchItem): RouteLocationRaw | null {
  if (item.type !== "属性") {
    return null;
  }
  if (item.spaceId === undefined || item.spaceId === null || !Number.isFinite(item.spaceId)) {
    return null;
  }
  const ontologyUniqueIdentifier = typeof item.ontologyUniqueIdentifier === "string" ? item.ontologyUniqueIdentifier.trim() : "";
  const spaceName = typeof item.spaceName === "string" ? item.spaceName.trim() : "";
  const objectName = typeof item.ontologyName === "string" ? item.ontologyName.trim() : "";
  if (!ontologyUniqueIdentifier || !spaceName || !objectName) {
    return null;
  }
  return {
    name: "OntologyObjectDetailAttribute",
    params: { objectId: ontologyUniqueIdentifier },
    query: {
      spaceId: String(item.spaceId),
      spaceName,
      objectName,
    },
  };
}
