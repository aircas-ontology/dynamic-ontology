import { computed } from "vue";
import { useRoute } from "vue-router";
import type { OntologyObjectDetailTab } from "@/types";
import { AVAILABLE_OBJECT_DETAIL_TABS, objectDetailTabFromRouteName } from "../utils/objectDetailTabs";

/**
 * @description 本体对象详情页面工作区 composable：解析当前路由中的 objectId、query 中的
 * spaceId/spaceName/objectName，推导激活的 Tab 标识并暴露导航上下文。
 * @returns objectId、activeTab、availableTabs、objectName、spaceId、spaceName。
 */
export function useObjectDetailWorkspace() {
  const route = useRoute();

  const objectId = computed(() => String(route.params.objectId || ""));
  const activeTab = computed<OntologyObjectDetailTab>(() => objectDetailTabFromRouteName(route.name) ?? "object");
  const availableTabs = computed(() => AVAILABLE_OBJECT_DETAIL_TABS);

  const objectName = computed(() => {
    const fromQuery = route.query.objectName;
    if (typeof fromQuery === "string" && fromQuery.trim()) return fromQuery.trim();
    return objectId.value ? `对象 ${objectId.value}` : "未命名对象";
  });

  const spaceId = computed(() => {
    const fromQuery = route.query.spaceId;
    return typeof fromQuery === "string" ? fromQuery : "";
  });

  const spaceName = computed(() => {
    const fromQuery = route.query.spaceName;
    return typeof fromQuery === "string" ? fromQuery : "";
  });

  return {
    objectId,
    activeTab,
    availableTabs,
    objectName,
    spaceId,
    spaceName,
  };
}
