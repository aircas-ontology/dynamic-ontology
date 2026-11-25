export interface ImplicitRelationNodeOption {
  spaceName: string;
  nodeName: string;
}

export interface ImplicitRelationDraft {
  startNode: string[];
  relationType: string;
  hops: string[];
}

export interface ValidatedImplicitRelation {
  spaceName: string;
  nodeName: string;
  relationType: string;
  hops: number[];
}

export interface ImplicitRelationValidationResult {
  error: string;
  value: ValidatedImplicitRelation | null;
}

/**
 * @description 校验新增隐含关系表单，并将跳数整理为正整数序列。
 * @param draft 表单草稿。
 * @param nodes 可选的起始节点列表。
 * @returns 校验错误与规范化后的数据。
 */
export function validateImplicitRelationDraft(draft: ImplicitRelationDraft, nodes: ImplicitRelationNodeOption[]): ImplicitRelationValidationResult {
  const [spaceName, nodeName] = draft.startNode;
  const node = spaceName && nodeName ? nodes.find((item) => item.spaceName === spaceName && item.nodeName === nodeName) : undefined;
  if (!node) return { error: "请选择起始节点", value: null };
  if (!draft.relationType) return { error: "请选择关联类型", value: null };
  if (!draft.hops.length) return { error: "请至少添加一个关系跳数", value: null };
  const hops: number[] = [];
  for (const hop of draft.hops) {
    const value = Number(hop);
    if (!Number.isInteger(value) || value <= 0) return { error: "关系跳数需为正整数", value: null };
    if (!hops.includes(value)) hops.push(value);
  }
  return {
    error: "",
    value: {
      spaceName: node.spaceName,
      nodeName: node.nodeName,
      relationType: draft.relationType,
      hops: [...hops].sort((left, right) => left - right),
    },
  };
}
