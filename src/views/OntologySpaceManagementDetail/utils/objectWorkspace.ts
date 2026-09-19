import type {
  OntologyConceptNode,
  OntologyObjectLocationTarget,
  OntologyObjectWorkspace,
} from "@/types";

export function findObjectWorkspace(
  workspaces: readonly OntologyObjectWorkspace[],
  spaceId: string,
): OntologyObjectWorkspace | undefined {
  return workspaces.find(workspace => workspace.spaceId === spaceId);
}

export function filterConceptTree(
  nodes: readonly OntologyConceptNode[],
  keyword: string,
): OntologyConceptNode[] {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("zh-CN");
  if (!normalizedKeyword) {
    return nodes.map(node => ({
      ...node,
      children: filterConceptTree(node.children, ""),
    }));
  }

  return nodes.flatMap(node => {
    const children = filterConceptTree(node.children, normalizedKeyword);
    if (!node.label.toLocaleLowerCase("zh-CN").includes(normalizedKeyword) && !children.length) return [];
    return [{ ...node, children }];
  });
}

export function makeCategoryLocationTarget(
  categoryId: string,
  requestId: number,
): OntologyObjectLocationTarget {
  return { categoryId, requestId };
}
