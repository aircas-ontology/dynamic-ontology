import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { OntologySpaceDetailLoadStatus, OntologySpaceItem } from "@/types";
import { ontologySpaceListMock } from "@/mocks/ontologySpaceListMock/ontologySpaceListMock";
import { useOntologySpaceDetailStore } from "@/stores/useOntologySpaceDetailStore";
import { findSpaceById } from "../utils/spaceLookup";
import { AVAILABLE_WORKSPACE_TABS, tabFromRouteName } from "../utils/workspaceTabs";

export function useSpaceWorkspace() {
  const route = useRoute();
  const detailStore = useOntologySpaceDetailStore();
  const status = ref<OntologySpaceDetailLoadStatus>("loading");
  const error = ref("");
  const space = ref<OntologySpaceItem | null>(null);

  const spaceId = computed(() => String(route.params.spaceId || ""));
  const activeTab = computed(() => tabFromRouteName(route.name) ?? "overview");
  const availableTabs = computed(() => AVAILABLE_WORKSPACE_TABS);
  const spaceDisplayName = computed(() => space.value?.displayName.trim() || "未命名空间");

  function load() {
    status.value = "loading";
    error.value = "";
    const next = findSpaceById(ontologySpaceListMock.data, spaceId.value);
    if (!spaceId.value || !next) {
      space.value = null;
      detailStore.clearCurrentSpace();
      status.value = "empty";
      return;
    }
    space.value = next;
    detailStore.setCurrentSpace(next.id, next.displayName);
    status.value = "ready";
  }

  watch(spaceId, load, { immediate: true });

  onUnmounted(() => {
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
