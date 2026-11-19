import {
  ROOT_METADATA_PARENT_ID,
  type OntologyAttributeMetadataRecord,
  type OntologyAttributeMetadataTreeNode,
  type OntologyAttributeMetadataValueType,
  type OntologyAttributeMetadataWorkspaceData,
  type OntologyAttributeMetadataWritePayload,
} from "@/types";

/** 元数据父级 TreeSelect 节点。 */
export interface OntologyAttributeMetadataParentSelectNode {
  id: string;
  label: string;
  children: OntologyAttributeMetadataParentSelectNode[];
}

/**
 * @description 生成本地原型用的唯一 id。
 * @param prefix id 前缀。
 * @returns 唯一 id。
 */
function createMetadataLocalId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @description 深拷贝元数据记录。
 * @param item 元数据记录。
 * @returns 拷贝后的记录。
 */
function cloneMetadataRecord(item: OntologyAttributeMetadataRecord): OntologyAttributeMetadataRecord {
  if (item.valueType === "enum") {
    return { ...item, value: [...item.value] };
  }
  if (item.valueType === "range") {
    return { ...item, value: item.value ? { ...item.value } : null };
  }
  return { ...item };
}

/**
 * @description 将扁平记录转为带空 children 的树节点。
 * @param item 元数据记录。
 * @returns 树节点。
 */
function toMetadataTreeNode(item: OntologyAttributeMetadataRecord): OntologyAttributeMetadataTreeNode {
  if (item.valueType === "input") {
    return { id: item.id, name: item.name, parentId: item.parentId, valueType: "input", value: item.value, children: [] };
  }
  if (item.valueType === "enum") {
    return { id: item.id, name: item.name, parentId: item.parentId, valueType: "enum", value: [...item.value], children: [] };
  }
  return {
    id: item.id,
    name: item.name,
    parentId: item.parentId,
    valueType: "range",
    value: item.value ? { ...item.value } : null,
    children: [],
  };
}

/**
 * @description 将扁平元数据列表组装为树。
 * @param items 扁平元数据列表。
 * @returns 树根节点列表。
 */
export function buildMetadataTree(items: OntologyAttributeMetadataRecord[]): OntologyAttributeMetadataTreeNode[] {
  const nodeMap = new Map<string, OntologyAttributeMetadataTreeNode>();
  for (const item of items) {
    nodeMap.set(item.id, toMetadataTreeNode(item));
  }
  const roots: OntologyAttributeMetadataTreeNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/**
 * @description 按 id 查找元数据记录。
 * @param items 扁平列表。
 * @param id 元数据 id。
 * @returns 命中记录；未找到返回 null。
 */
export function findMetadataRecordById(items: OntologyAttributeMetadataRecord[], id: string): OntologyAttributeMetadataRecord | null {
  return items.find((item) => item.id === id) ?? null;
}

/**
 * @description 收集某节点及其全部后代 id。
 * @param items 扁平列表。
 * @param rootId 起始节点 id。
 * @returns id 集合。
 */
export function collectMetadataDescendantIds(items: OntologyAttributeMetadataRecord[], rootId: string): Set<string> {
  const result = new Set<string>([rootId]);
  let growing = true;
  while (growing) {
    growing = false;
    for (const item of items) {
      if (item.parentId && result.has(item.parentId) && !result.has(item.id)) {
        result.add(item.id);
        growing = true;
      }
    }
  }
  return result;
}

/**
 * @description 根据元数据记录构建父级 TreeSelect 数据。
 * @param items 扁平元数据列表。
 * @param excludeIds 不可选为父级的节点（通常为自身及后代）。
 * @returns TreeSelect 节点列表。
 */
export function buildMetadataParentSelectTree(
  items: OntologyAttributeMetadataRecord[],
  excludeIds: ReadonlySet<string> = new Set(),
): OntologyAttributeMetadataParentSelectNode[] {
  /**
   * @description 递归裁剪不可选父级节点。
   * @param nodes 当前层树节点。
   * @returns 父级选择树节点。
   */
  function pruneSelectNodes(nodes: OntologyAttributeMetadataTreeNode[]): OntologyAttributeMetadataParentSelectNode[] {
    return nodes
      .filter((node) => !excludeIds.has(node.id))
      .map((node) => ({
        id: node.id,
        label: node.name,
        children: pruneSelectNodes(node.children),
      }));
  }
  return pruneSelectNodes(buildMetadataTree(items));
}

/**
 * @description 返回值类型的中文标签。
 * @param valueType 值类型。
 * @returns 中文标签。
 */
export function resolveMetadataValueTypeLabel(valueType: OntologyAttributeMetadataValueType): string {
  if (valueType === "input") return "输入值";
  if (valueType === "enum") return "枚举";
  return "范围";
}

/**
 * @description 将元数据值格式化为表格展示文案。
 * @param item 元数据记录。
 * @returns 值摘要。
 */
export function formatMetadataValueSummary(item: OntologyAttributeMetadataRecord): string {
  if (item.valueType === "input") return item.value.trim() || "—";
  if (item.valueType === "enum") return item.value.length ? item.value.join(" / ") : "—";
  return item.value ? `${item.value.min} ~ ${item.value.max}` : "—";
}

/**
 * @description 解析父级展示名称。
 * @param items 扁平列表。
 * @param parentId 父级 id。
 * @returns 父级名称；根级返回「元数据」。
 */
export function resolveMetadataParentName(items: OntologyAttributeMetadataRecord[], parentId: string): string {
  if (!parentId || parentId === ROOT_METADATA_PARENT_ID) return "元数据";
  return findMetadataRecordById(items, parentId)?.name || "—";
}

/**
 * @description 新增一条元数据记录。
 * @param data 工作区数据。
 * @param payload 写入载荷。
 * @returns 更新后的工作区数据。
 */
export function addMetadataRecord(
  data: OntologyAttributeMetadataWorkspaceData,
  payload: OntologyAttributeMetadataWritePayload,
): OntologyAttributeMetadataWorkspaceData {
  const name = payload.name.trim();
  if (!name) throw new Error("元数据名称不能为空");
  const parentId = payload.parentId.trim();
  if (parentId && parentId !== ROOT_METADATA_PARENT_ID && !findMetadataRecordById(data.items, parentId)) {
    throw new Error("父级不存在");
  }
  const normalizedParentId = parentId === ROOT_METADATA_PARENT_ID ? ROOT_METADATA_PARENT_ID : parentId;

  let nextItem: OntologyAttributeMetadataRecord;
  if (payload.valueType === "input") {
    const value = payload.value.trim();
    if (!value) throw new Error("请填写输入值");
    nextItem = {
      id: createMetadataLocalId("metadata"),
      name,
      parentId: normalizedParentId,
      valueType: "input",
      value,
    };
  } else if (payload.valueType === "enum") {
    const values = payload.value.map((entry) => entry.trim()).filter(Boolean);
    if (!values.length) throw new Error("请至少填写一个枚举值");
    nextItem = {
      id: createMetadataLocalId("metadata"),
      name,
      parentId: normalizedParentId,
      valueType: "enum",
      value: values,
    };
  } else {
    const { min, max } = payload.value;
    if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error("请填写有效的范围数值");
    if (min > max) throw new Error("最小值不能大于最大值");
    nextItem = {
      id: createMetadataLocalId("metadata"),
      name,
      parentId: normalizedParentId,
      valueType: "range",
      value: { min, max },
    };
  }

  return {
    items: [...data.items.map(cloneMetadataRecord), nextItem],
  };
}

/**
 * @description 删除元数据及其全部后代。
 * @param data 工作区数据。
 * @param itemId 待删除元数据 id。
 * @returns 更新后的工作区数据。
 */
export function removeMetadataRecord(data: OntologyAttributeMetadataWorkspaceData, itemId: string): OntologyAttributeMetadataWorkspaceData {
  if (!findMetadataRecordById(data.items, itemId)) throw new Error("元数据不存在");
  const removing = collectMetadataDescendantIds(data.items, itemId);
  return {
    items: data.items.filter((item) => !removing.has(item.id)).map(cloneMetadataRecord),
  };
}
