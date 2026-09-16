import { onScopeDispose, ref, watch, type Ref } from "vue";
import type { OntologySpaceOverview } from "@/types";
import { ontologySpaceManagementDetailMock } from "@/mocks/ontologySpaceManagementDetailMock/ontologySpaceManagementDetailMock";

export function useSpaceOverview(spaceId: Ref<string>, loader: (id: string) => Promise<OntologySpaceOverview | undefined> = async id => structuredClone(ontologySpaceManagementDetailMock.find(item => item.spaceId === id))) {
  const data = ref<OntologySpaceOverview>();
  const loading = ref(false);
  const error = ref("");
  let generation = 0;
  let disposed = false;
  let pendingId: string | undefined;
  async function load() {
    const id = spaceId.value;
    if (disposed || (loading.value && pendingId === id)) return;
    const request = ++generation;
    pendingId = id;
    loading.value = true;
    error.value = "";
    data.value = undefined;
    try {
      const result = await loader(id);
      if (!disposed && request === generation) data.value = result;
    } catch {
      if (!disposed && request === generation) error.value = "空间统计加载失败，请重试。";
    } finally {
      if (!disposed && request === generation) loading.value = false;
    }
  }
  watch(spaceId, load, { immediate: true });
  onScopeDispose(() => { disposed = true; generation++; });
  return { data, loading, error, load };
}
