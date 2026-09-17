import { onScopeDispose, ref, watch, type Ref } from "vue";
import type { OntologyObjectWorkspace } from "@/types";
import { getOntologyCategoryTreeInterface } from "@/apis";
import { mapOntologyCategoryTree } from "../utils/mapOntologyCategoryTree";

export type OntologyObjectWorkspaceStatus = "loading" | "success" | "empty" | "error";

/**
 * @description 创建空的本体对象工作区壳。
 * @param spaceId 当前空间 id。
 * @returns 无概念树、无分区列表的工作区。
 */
function createEmptyObjectWorkspace(spaceId: string): OntologyObjectWorkspace {
  return { spaceId, tree: [], sections: [] };
}

/**
 * @description 按空间 id 请求分类体系树并组装对象工作区；右侧分区暂留空。
 * @param spaceId 路由空间 id。
 * @returns 映射后的工作区；无 spaceId 时返回空壳。
 */
async function loadObjectWorkspaceFromCategoryTree(spaceId: string): Promise<OntologyObjectWorkspace> {
  const id = spaceId.trim();
  if (!id) return createEmptyObjectWorkspace(spaceId);

  const response = await getOntologyCategoryTreeInterface({ spaceId: id });
  if (response.code === 200) {
    return {
      spaceId: id,
      tree: mapOntologyCategoryTree(response.data),
      sections: [],
    };
  }
  throw new Error(response.message || "本体分类体系树查询失败");
}

/**
 * @description 按空间 id 加载本体对象工作区；默认拉取分类体系树填充左侧概念树。
 * @param spaceId 路由中的空间 id。
 * @param loader 可选自定义加载器，便于测试注入。
 * @returns 加载状态、错误文案、工作区数据与重新加载方法。
 */
export function useOntologyObjectWorkspace(
  spaceId: Ref<string>,
  loader: (id: string) => Promise<OntologyObjectWorkspace | undefined> = loadObjectWorkspaceFromCategoryTree,
) {
  const status = ref<OntologyObjectWorkspaceStatus>("loading");
  const error = ref("");
  const workspace = ref<OntologyObjectWorkspace>();
  let generation = 0;
  let disposed = false;
  let pendingSpaceId = "";

  /**
   * @description 加载当前空间的对象工作区；有工作区即为 success。
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
