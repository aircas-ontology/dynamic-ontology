import type { GetOntologyMetaByObjectIdData, OntologyGlobalSearchItem } from "@/types";
import type { RouteLocationRaw } from "vue-router";

/**
 * @description 将全局检索结果解析为可跳转的命名路由；同步支持空间、对象与关系分组。
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
  if (item.type === "关系分组") {
    return {
      name: "OntologySpaceManagementDetailRelation",
      params: { spaceId },
    };
  }
  return null;
}

/**
 * @description 将属性检索结果与对象简要信息拼成对象详情「属性」Tab 路由。
 * @param item 检索结果条目，需含 spaceId。
 * @param meta 按 objectId 查询得到的对象简要信息。
 * @returns 对象详情属性 Tab 路由；缺少必要字段时返回 null。
 */
export function resolveOntologyGlobalSearchPropertyRoute(item: OntologyGlobalSearchItem, meta: GetOntologyMetaByObjectIdData): RouteLocationRaw | null {
  if (item.type !== "属性") {
    return null;
  }
  if (item.spaceId === undefined || item.spaceId === null || !Number.isFinite(item.spaceId)) {
    return null;
  }
  const uniqueIdentifier = meta.uniqueIdentifier.trim();
  if (!uniqueIdentifier) {
    return null;
  }
  return {
    name: "OntologyObjectDetailAttribute",
    params: { objectId: uniqueIdentifier },
    query: {
      spaceId: String(item.spaceId),
      spaceName: meta.spaceName.trim(),
      objectName: meta.displayName.trim(),
    },
  };
}
