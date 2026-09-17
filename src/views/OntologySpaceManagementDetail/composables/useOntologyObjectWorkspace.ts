import { onScopeDispose, ref, watch, type Ref } from "vue";
import type { OntologyObjectWorkspace } from "@/types";

export type OntologyObjectWorkspaceStatus = "loading" | "success" | "empty" | "error";

/**
 * @description 创建空的本体对象工作区壳，供未接接口前展示基础左右布局。
 * @param spaceId 当前空间 id。
 * @returns 无概念树、无分区列表的工作区。
 */
function createEmptyObjectWorkspace(spaceId: string): OntologyObjectWorkspace {
  return { spaceId, tree: [], sections: [] };
}

/**
 * @description 按空间 id 加载本体对象工作区；默认返回空壳数据以展示基础界面。
 * @param spaceId 路由中的空间 id。
 * @param loader 可选自定义加载器，便于后续接接口或测试注入。
 * @returns 加载状态、错误文案、工作区数据与重新加载方法。
 */
export function useOntologyObjectWorkspace(
  spaceId: Ref<string>,
  loader: (id: string) => Promise<OntologyObjectWorkspace | undefined> = async (id) => createEmptyObjectWorkspace(id),
) {
  const status = ref<OntologyObjectWorkspaceStatus>("loading");
  const error = ref("");
  const workspace = ref<OntologyObjectWorkspace>();
  let generation = 0;
  let disposed = false;
  let pendingSpaceId = "";

  /**
   * @description 加载当前空间的对象工作区；有数据壳即为 success，便于展示空布局。
   */
  async function load() {
    const id = spaceId.value;
    if (disposed || (status.value === "loading" && pendingSpaceId === id)) return;
    const request = ++generation;
    pendingSpaceId = id;
    status.value = "loading";
    error.value = "";
    workspace.value = undefined;
    try {
      const result = await loader(id);
      if (disposed || request !== generation) return;
      workspace.value = result;
      status.value = result ? "success" : "empty";
    } catch {
      if (disposed || request !== generation) return;
      status.value = "error";
      error.value = "本体对象加载失败，请重试。";
    }
  }

  watch(spaceId, load, { immediate: true });
  onScopeDispose(() => {
    disposed = true;
    generation += 1;
  });

  return { status, error, workspace, load };
}
