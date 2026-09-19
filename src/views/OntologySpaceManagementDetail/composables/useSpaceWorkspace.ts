import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { OntologySpaceDetailLoadStatus, OntologySpaceItem } from "@/types";
import { getOntologySpaceListInterface } from "@/apis";
import { mapOntologySpaceList } from "@/utils/mapOntologySpaceList";
import { useOntologySpaceDetailStore } from "@/stores/useOntologySpaceDetailStore";
import { findSpaceById } from "../utils/spaceLookup";
import { AVAILABLE_WORKSPACE_TABS, tabFromRouteName } from "../utils/workspaceTabs";

/**
 * @description 按路由 spaceId 从本体空间列表接口解析当前空间，驱动详情页状态与面包屑名称。
 * @returns 详情加载状态、当前空间、Tab 与重新加载方法。
 */
export function useSpaceWorkspace() {
  const route = useRoute();
  const detailStore = useOntologySpaceDetailStore();
  const status = ref<OntologySpaceDetailLoadStatus>("loading");
  const error = ref("");
  const space = ref<OntologySpaceItem | null>(null);
  let generation = 0;
  let disposed = false;

  const spaceId = computed(() => String(route.params.spaceId || ""));
  const activeTab = computed(() => tabFromRouteName(route.name) ?? "overview");
  const availableTabs = computed(() => AVAILABLE_WORKSPACE_TABS);
  const spaceDisplayName = computed(() => space.value?.displayName.trim() || "未命名空间");

  /**
   * @description 请求列表接口并按当前 spaceId 匹配空间；无 id/未命中为 empty，请求失败为 error。
   */
  async function load() {
    const id = spaceId.value;
    const request = ++generation;
    status.value = "loading";
    error.value = "";
    space.value = null;

    if (!id.trim()) {
      detailStore.clearCurrentSpace();
      status.value = "empty";
      return;
    }

    try {
      const response = await getOntologySpaceListInterface();
      if (disposed || request !== generation) return;
      if (response.code === 200) {
        const next = findSpaceById(mapOntologySpaceList(response.data), id);
        if (!next) {
          detailStore.clearCurrentSpace();
          status.value = "empty";
          return;
        }
        space.value = next;
        detailStore.setCurrentSpace(next.id, next.displayName);
        status.value = "ready";
        return;
      }
      throw new Error(response.message || "本体空间列表查询失败");
    } catch (cause) {
      if (disposed || request !== generation) return;
      space.value = null;
      detailStore.clearCurrentSpace();
      status.value = "error";
      error.value = cause instanceof Error && cause.message.trim() ? cause.message : "空间加载失败，请重试。";
    }
  }

  watch(spaceId, () => {
    void load();
  }, { immediate: true });

  onUnmounted(() => {
    disposed = true;
    generation += 1;
    detailStore.clearCurrentSpace();
  });

  return {
    status,
    error,
    space,
    spaceId,
    activeTab,
    availableTabs,
    spaceDisplayName,
    load,
  };
}
