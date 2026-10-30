import type { OntologyConceptNode, OntologyObjectLocationTarget, OntologyObjectWorkspace } from "@/types";

/**
 * @description 按空间 id 查找对象工作区样例。
 * @param workspaces 工作区列表
 * @param spaceId 空间 id
 * @returns 匹配的工作区或 undefined
 */
export function findObjectWorkspace(workspaces: readonly OntologyObjectWorkspace[], spaceId: string): OntologyObjectWorkspace | undefined {
  return workspaces.find((workspace) => workspace.spaceId === spaceId);
}

/**
 * @description 按关键字过滤概念分类树。
 * @param nodes 分类树节点
 * @param keyword 搜索关键字
 * @returns 过滤后的分类树
 */
export function filterConceptTree(nodes: readonly OntologyConceptNode[], keyword: string): OntologyConceptNode[] {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("zh-CN");
  if (!normalizedKeyword) {
    return nodes.map((node) => ({
      ...node,
      children: filterConceptTree(node.children, ""),
    }));
  }

  return nodes.flatMap((node) => {
    const children = filterConceptTree(node.children, normalizedKeyword);
    if (!node.label.toLocaleLowerCase("zh-CN").includes(normalizedKeyword) && !children.length) return [];
    return [{ ...node, children }];
  });
}

/**
 * @description 构造右侧列表定位目标。
 * @param categoryId 分类 id
 * @param requestId 定位请求序号，用于重复定位同一分类
 * @returns 定位目标
 */
export function makeCategoryLocationTarget(categoryId: string, requestId: number): OntologyObjectLocationTarget {
  return { categoryId, requestId };
}

/**
 * @description 构造携带对象 id 的定位目标，供列表滚动并高亮具体对象。
 * @param categoryId 对象所属分类 id
 * @param objectId 对象唯一标识
 * @param requestId 定位请求序号，用于重复定位同一对象
 * @returns 定位目标
 */
export function makeObjectLocationTarget(categoryId: string, objectId: string, requestId: number): OntologyObjectLocationTarget {
  return { categoryId, objectId, requestId };
}

/**
 * @description 递归收集分类树下拉选项。
 * @param nodes 分类树
 * @returns 分类选项列表
 */
export function collectCategoryOptions(nodes: readonly OntologyConceptNode[]): Array<{ id: string; name: string }> {
  const options: Array<{ id: string; name: string }> = [];

  /**
   * @description 递归访问分类节点并写入选项。
   * @param currentNodes 当前层级节点
   */
  function visit(currentNodes: readonly OntologyConceptNode[]) {
    currentNodes.forEach((node) => {
      options.push({ id: node.targetCategoryId ?? node.id, name: node.label || `分类 ${node.id}` });
      visit(node.children);
    });
  }

  visit(nodes);
  return options;
}

/**
 * @description 递归增加分类节点中的对象数量；命中节点及其祖先均 +1，与子树合计统计一致。
 * @param nodes 当前分类树节点
 * @param categoryId 目标分类 id
 * @returns 是否找到目标分类
 */
export function incrementCategoryCount(nodes: OntologyConceptNode[], categoryId: string): boolean {
  for (const node of nodes) {
    if ((node.targetCategoryId ?? node.id) === categoryId) {
      node.count += 1;
      return true;
    }
    if (incrementCategoryCount(node.children, categoryId)) {
      node.count += 1;
      return true;
    }
  }
  return false;
}
