import { onScopeDispose, ref, watch } from "vue";
import { getOntologyRelationCategoryTreeInterface } from "@/apis";
import type { OntologyRelationCategoryTreeNode } from "@/types";

/** @description 读取浏览用关系分类，独立处理错误、重复请求、空间切换和卸载失效。 @param getSpaceId 当前空间。 @returns 分类状态与重试。 */
export function useEntityRelationCategories(getSpaceId: () => string) {
  const items = ref<OntologyRelationCategoryTreeNode>();
  const status = ref<"loading" | "ready" | "empty" | "error">("loading");
  const error = ref("");
  let revision = 0;
  let pending: string | undefined;
  let disposed = false;
  /** @description 加载真实分类树，同空间请求进行中时不重复发送。 @returns 查询结束。 */
  async function fetchRelationCategories(): Promise<void> {
    const spaceId = getSpaceId();
    if (disposed || pending === spaceId) return;
    const token = ++revision;
    pending = spaceId;
    status.value = "loading";
    error.value = "";
    items.value = undefined;
    try {
      if (!spaceId.trim() || !Number.isSafeInteger(Number(spaceId)) || Number(spaceId) <= 0) throw new Error("空间标识无效");
      const response = await getOntologyRelationCategoryTreeInterface({ spaceId });
      if (disposed || token !== revision) return;
      if ((response.code !== 200 && response.code !== 0) || response.success === false || !response.data)
        throw new Error(response.message || "关系分类加载失败");
      items.value = response.data;
      status.value = items.value.children?.length ? "ready" : "empty";
    } catch (cause) {
      if (!disposed && token === revision) {
        status.value = "error";
        error.value = cause instanceof Error ? cause.message : "关系分类加载失败";
      }
    } finally {
      if (token === revision) pending = undefined;
    }
  }
  watch(
    getSpaceId,
    () => {
      pending = undefined;
      void fetchRelationCategories();
    },
    { immediate: true },
  );
  onScopeDispose(() => {
    disposed = true;
    revision++;
  });
  return { items, status, error, fetchRelationCategories };
}
