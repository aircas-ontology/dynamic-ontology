import { onScopeDispose, ref, watch, type Ref } from "vue";
import { getListOntologyActionInterface } from "@/apis";

/**
 * @description 按空间查询已发布对象行为总数，供浏览 Tab 角标展示；忽略重复请求与过期响应。
 * @param spaceId 当前空间标识。
 * @returns 行为总数、加载状态与重试方法。
 */
export function useEntityBrowseBehaviorCount(spaceId: Ref<string>) {
  const behaviorTotal = ref(0);
  const status = ref<"loading" | "ready" | "error">("loading");
  let generation = 0;
  let pendingId = "";
  let disposed = false;

  /**
   * @description 拉取当前空间已发布行为列表第一页以读取 total。
   */
  async function loadBrowseBehaviorCount(): Promise<void> {
    const id = spaceId.value.trim();
    if (disposed || (id && status.value === "loading" && pendingId === id)) return;
    const request = ++generation;
    pendingId = id;
    status.value = "loading";
    behaviorTotal.value = 0;
    try {
      const numericSpaceId = Number(id);
      if (!id || !Number.isInteger(numericSpaceId) || numericSpaceId <= 0) throw new Error("空间标识无效");
      const response = await getListOntologyActionInterface({
        ontologySpaceId: numericSpaceId,
        pageNum: 1,
        pageSize: 1,
        status: 1,
      });
      if (disposed || request !== generation || id !== spaceId.value.trim()) return;
      if ((response.code !== 0 && response.code !== 200) || !response.data) {
        throw new Error(response.message || "行为数量加载失败");
      }
      behaviorTotal.value = Number(response.data.total) || 0;
      status.value = "ready";
    } catch {
      if (disposed || request !== generation) return;
      behaviorTotal.value = 0;
      status.value = "error";
    } finally {
      if (request === generation) pendingId = "";
    }
  }

  watch(spaceId, () => void loadBrowseBehaviorCount(), { immediate: true });
  onScopeDispose(() => {
    disposed = true;
    generation += 1;
  });

  return { behaviorTotal, status, loadBrowseBehaviorCount };
}
