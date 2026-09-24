import type { TreeNodeData } from "element-plus";

export interface SubspaceCreateSelectedObject {
  id: string;
  label: string;
  apiName: string;
}

/**
 * @description 读取树节点字段并转成卡片文本。
 * @param node 树节点数据。
 * @param key 字段名。
 * @returns 字符串字段值。
 */
function readSelectedObjectText(node: TreeNodeData, key: string): string {
  const value = Reflect.get(node, key);
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
}

/**
 * @description 将分类树勾选的叶子节点映射为右侧对象卡片数据。
 * @param nodes 树勾选的叶子节点。
 * @returns 选中对象列表。
 */
export function mapSubspaceCreateSelectedObjects(nodes: TreeNodeData[]): SubspaceCreateSelectedObject[] {
  return nodes.map((node) => {
    const id = readSelectedObjectText(node, "id");
    const label = readSelectedObjectText(node, "label");
    const apiName = readSelectedObjectText(node, "apiName") || id;
    return { id, label, apiName };
  });
}
