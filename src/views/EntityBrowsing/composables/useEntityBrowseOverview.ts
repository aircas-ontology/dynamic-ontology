import { onScopeDispose, ref } from "vue";
import type { EntityBrowseOverview } from "@/types";
import { entityBrowseOverviewMock } from "../mocks/entityBrowseOverviewMock";
import { mapEntityBrowseOverview } from "../utils/mapEntityBrowseOverview";

export { mapEntityBrowseOverview } from "../utils/mapEntityBrowseOverview";

/**
 * @description 加载实体浏览顶部统计与质量情况；当前无后端服务，固定返回 Mock。
 * @returns 概览状态、错误信息与加载方法。
 */
export function useEntityBrowseOverview() {
  const overview = ref<EntityBrowseOverview | null>(null);
  const status = ref<"loading" | "success" | "error">("loading");
  const error = ref("");
  let generation = 0;
  let disposed = false;

  /**
   * @description 读取 Mock 概览并写入页面状态，防止卸载后过期写入。
   */
  async function loadEntityBrowseOverview(): Promise<void> {
    const request = ++generation;
    status.value = "loading";
    error.value = "";
    overview.value = null;
    try {
      await Promise.resolve();
      if (disposed || request !== generation) return;
      overview.value = mapEntityBrowseOverview(entityBrowseOverviewMock);
      status.value = "success";
    } catch (cause) {
      if (disposed || request !== generation) return;
      status.value = "error";
      error.value = cause instanceof Error && cause.message.trim() ? cause.message : "统计信息加载失败，请重试。";
    }
  }

  void loadEntityBrowseOverview();

  onScopeDispose(() => {
    disposed = true;
    generation += 1;
  });

  return {
    overview,
    status,
    error,
    loadEntityBrowseOverview,
  };
}
