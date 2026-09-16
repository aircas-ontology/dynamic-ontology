import { computed, onScopeDispose, ref, watch } from "vue";
import type { OntologySpaceDraft, OntologySpaceItem, OntologySpaceLoadStatus, OntologySpaceSortOrder, OntologySpaceSummary, OntologyViewMode } from "@/types";
import { getOntologySpaceListInterface } from "@/apis";
import { ontologySpaceListMock } from "@/mocks/ontologySpaceListMock/ontologySpaceListMock";
import { filterSpaces, removeSpace, saveSpace } from "../utils/spaceOperations";

/**
 * @description 查询本体空间列表；远程服务暂不可用期间回退到本地样例数据，接口恢复后可移除此回退。
 * @returns 本体空间数组的深拷贝，避免页面编辑污染样例数据。
 */
async function loadOntologySpaces(): Promise<OntologySpaceItem[]> {
  try {
    const response = await getOntologySpaceListInterface();
    if (response.code === 200) {
      return structuredClone(response.data);
    }
    throw new Error(`本体空间列表查询失败：${response.message}`);
  } catch {
    return structuredClone(ontologySpaceListMock.data);
  }
}

/** 本页独占的演示状态，离开页面后释放，数据不写入浏览器存储。 */
export function useSpaceManagement(loader: () => Promise<OntologySpaceItem[]> = loadOntologySpaces) {
  const spaces = ref<OntologySpaceItem[]>([]);
  const keyword = ref("");
  const order = ref<OntologySpaceSortOrder>("asc");
  const viewMode = ref<OntologyViewMode>("table");
  const page = ref(1);
  const pageSize = ref(10);
  const status = ref<OntologySpaceLoadStatus>("loading");
  const error = ref("");
  let disposed = false;
  let pending = false;
  onScopeDispose(() => {
    disposed = true;
  });
  const result = computed(() => filterSpaces(spaces.value, keyword.value, order.value, page.value, pageSize.value));
  watch(
    [keyword, order, pageSize],
    () => {
      page.value = 1;
    },
    { flush: "sync" },
  );
  watch(
    () => result.value.page,
    (value) => {
      page.value = value;
    },
  );
  const summaryStats = computed<OntologySpaceSummary[]>(() => [
    { id: "space", label: "本体空间", value: spaces.value.length, icon: "Box" },
    { id: "object", label: "本体对象", value: spaces.value.reduce((sum, space) => sum + space.metrics.ontology, 0), icon: "Connection" },
    { id: "behavior", label: "行为数量", value: spaces.value.reduce((sum, space) => sum + space.metrics.behavior, 0), icon: "Share" },
    { id: "relation", label: "关系", value: spaces.value.reduce((sum, space) => sum + space.metrics.relation, 0), icon: "Link" },
  ]);
  async function load() {
    if (pending || disposed) return;
    pending = true;
    status.value = "loading";
    error.value = "";
    try {
      const data = await loader();
      if (disposed) return;
      spaces.value = data;
      status.value = data.length ? "success" : "empty";
    } catch {
      if (!disposed) {
        status.value = "error";
        error.value = "本体空间加载失败，请重试。";
      }
    } finally {
      pending = false;
    }
  }
  function save(draft: OntologySpaceDraft, id?: string) {
    spaces.value = saveSpace(spaces.value, draft, id);
    status.value = "success";
  }
  function remove(id: string) {
    spaces.value = removeSpace(spaces.value, id);
    status.value = spaces.value.length ? "success" : "empty";
  }
  return { spaces, keyword, order, viewMode, page, pageSize, status, error, result, summaryStats, load, save, remove };
}
