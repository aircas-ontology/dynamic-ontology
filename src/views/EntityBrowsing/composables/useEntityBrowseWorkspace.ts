import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { OntologySpaceDetailLoadStatus } from "@/types";
import { useOntologySpaceDetailStore } from "@/stores/useOntologySpaceDetailStore";
import { AVAILABLE_ENTITY_BROWSING_TABS, tabFromEntityBrowseRouteName } from "../utils/workspaceTabs";

/**
 * @description 从路由上下文初始化空间浏览页面，不新增接口请求。
 * @returns 空间状态、标识及当前工作区标签。
 */
export function useEntityBrowseWorkspace() {
  const route = useRoute();
  const detailStore = useOntologySpaceDetailStore();
  const status = ref<OntologySpaceDetailLoadStatus>("loading");
  const error = ref("");
  const spaceId = computed(() => (typeof route.params.spaceId === "string" ? route.params.spaceId.trim() : ""));
  const activeTab = computed(() => tabFromEntityBrowseRouteName(route.name) ?? "object");
  const availableTabs = computed(() => AVAILABLE_ENTITY_BROWSING_TABS);

  /** @description 校验当前空间标识并同步空间显示名称。 */
  function loadEntityBrowseSpace(): void {
    const id = spaceId.value;
    if (!id) {
      detailStore.clearCurrentSpace();
      status.value = "empty";
      return;
    }
    const name = typeof route.query.spaceName === "string" ? route.query.spaceName.trim() : "";
    detailStore.setCurrentSpace(id, name || "未命名空间");
    status.value = "ready";
  }

  watch(() => [spaceId.value, route.query.spaceName, route.query.spaceType, route.query.from], loadEntityBrowseSpace, { immediate: true });
  onUnmounted(() => detailStore.clearCurrentSpace());
  return { status, error, spaceId, activeTab, availableTabs, loadEntityBrowseSpace };
}
