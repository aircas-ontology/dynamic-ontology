import { onScopeDispose, ref, watch, type Ref } from "vue";
import type { OntologyInheritanceTreeNode, OntologyObjectItem, OntologyObjectWorkspace } from "@/types";
import { getOntologyCategoryTreeInterface, getOntologyInheritanceTreeInterface } from "@/apis";
import { mapOntologyCategorySections, mapOntologyCategoryTree } from "../utils/mapOntologyCategoryTree";

export type OntologyObjectWorkspaceStatus = "loading" | "success" | "empty" | "error";

/**
 * @description 判断分类树接口是否没有返回 data。
 * @param data 接口响应中的 data 字段。
 * @returns 未返回分类树时为 true。
 */
function isMissingOntologyCategoryTreeData(data: unknown): boolean {
  return data == null;
}

/**
 * @description 创建没有分类和对象的工作区。
 * @param spaceId 当前空间 id。
 * @returns 空工作区。
 */
function createEmptyObjectWorkspace(spaceId: string): OntologyObjectWorkspace {
  return { spaceId, tree: [], sections: [], inheritanceObjects: [] };
}

/** @description 将继承树节点展开为对象列表，供继承树组件补建空间根节点。 */
function flattenInheritanceTree(nodes: OntologyInheritanceTreeNode[], parentUniqueIdentifier = ""): OntologyObjectItem[] {
  return nodes.flatMap((node) => {
    const id = node.uniqueIdentifier.trim();
    if (!id) return [];
    const item = {
      id,
      categoryId: "",
      displayName: node.displayName,
      apiName: "",
      description: "",
      ...(node.parentUniqueIdentifier?.trim() || parentUniqueIdentifier
        ? { parentUniqueIdentifier: node.parentUniqueIdentifier?.trim() || parentUniqueIdentifier }
        : {}),
      parentDisplayName: "",
      createdAt: "",
      iconUrl: "",
      metrics: { attribute: 0, relation: 0, behavior: 0 },
    } satisfies OntologyObjectItem;
    return [item, ...flattenInheritanceTree(node.childNodes ?? [], id)];
  });
}

/**
 * @description 请求分类树并使用响应内嵌的对象元信息构建左右工作区。
 * @param spaceId 路由空间 id。
 * @returns 分类树和对象列表工作区。
 */
async function loadObjectWorkspaceFromCategoryTree(spaceId: string): Promise<OntologyObjectWorkspace | undefined> {
  const id = spaceId.trim();
  if (!id) return createEmptyObjectWorkspace(spaceId);
  const [response, inheritanceResponse] = await Promise.all([
    getOntologyCategoryTreeInterface({ spaceId: id }),
    getOntologyInheritanceTreeInterface({ spaceId: id }),
  ]);
  if (response.code !== 200) throw new Error(response.message || "对象分类体系树查询失败");
  if (inheritanceResponse.code !== 200) throw new Error(inheritanceResponse.message || "对象继承层级树查询失败");
  if (isMissingOntologyCategoryTreeData(response.data))
    return { ...createEmptyObjectWorkspace(id), inheritanceObjects: flattenInheritanceTree(inheritanceResponse.data ?? []) };
  return {
    spaceId: id,
    tree: mapOntologyCategoryTree(response.data),
    sections: mapOntologyCategorySections(response.data),
    inheritanceObjects: flattenInheritanceTree(inheritanceResponse.data ?? []),
  };
}

/**
 * @description 管理对象工作区加载状态；分类树选择由页面通过锚点定位右侧对应分区。
 * @param spaceId 路由中的空间 id。
 * @param loader 可选初始化加载器，便于测试注入。
 * @returns 工作区状态、数据和重新加载方法。
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
   * @description 加载当前空间分类树及其内嵌对象数据。
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
      status.value = result ? (result.sections.length ? "success" : "empty") : "empty";
    } catch (cause) {
      if (disposed || request !== generation) return;
      status.value = "error";
      error.value = cause instanceof Error && cause.message.trim() ? cause.message : "对象加载失败，请重试。";
    }
  }

  watch(spaceId, load, { immediate: true });
  onScopeDispose(() => {
    disposed = true;
    generation += 1;
  });

  return { status, error, workspace, load };
}
