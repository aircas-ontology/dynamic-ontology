import type { OntologyAttributeMetadataRecord } from "@/types";

/** 属性侧元数据值编辑草稿。 */
export type AttributeMetadataValueDraft =
  { valueType: "input"; value: string } | { valueType: "enum"; value: string[] } | { valueType: "range"; min: number | null; max: number | null };

/** 属性草稿中用于 UI 回显与接口提交的元数据状态。 */
export interface AttributeMetadataDraftState {
  selectedRecords: OntologyAttributeMetadataRecord[];
  nested: Record<string, unknown>;
  catalog: OntologyAttributeMetadataRecord[];
}

/** 接口 metadata 嵌套 JSON 的根键。 */
export const ATTRIBUTE_METADATA_NESTED_ROOT_KEY = "元数据";

/**
 * @description 从目录记录或已选记录生成可编辑值草稿。
 * @param record 元数据记录。
 * @returns 值草稿。
 */
export function createAttributeMetadataValueDraft(record: OntologyAttributeMetadataRecord): AttributeMetadataValueDraft {
  if (record.valueType === "input") return { valueType: "input", value: record.value };
  if (record.valueType === "enum") return { valueType: "enum", value: [...record.value] };
  return { valueType: "range", min: record.value?.min ?? null, max: record.value?.max ?? null };
}

/**
 * @description 将勾选 id 与值草稿组装为属性草稿中的选中元数据记录。
 * @param checkedIds 勾选的元数据 id。
 * @param catalog 目录扁平记录。
 * @param drafts 按 id 索引的值草稿。
 * @returns 选中记录列表；缺少目录项时跳过。
 */
export function buildSelectedAttributeMetadataRecords(
  checkedIds: string[],
  catalog: OntologyAttributeMetadataRecord[],
  drafts: Record<string, AttributeMetadataValueDraft>,
): OntologyAttributeMetadataRecord[] {
  const catalogById = new Map(catalog.map((item) => [item.id, item]));
  const records: OntologyAttributeMetadataRecord[] = [];
  for (const id of checkedIds) {
    const base = catalogById.get(id);
    if (!base) continue;
    const draft = drafts[id] ?? createAttributeMetadataValueDraft(base);
    if (base.valueType === "input") {
      const value = draft.valueType === "input" ? draft.value : "";
      records.push({ id: base.id, name: base.name, parentId: base.parentId, valueType: "input", value });
      continue;
    }
    if (base.valueType === "enum") {
      const value = draft.valueType === "enum" ? [...draft.value] : [];
      records.push({ id: base.id, name: base.name, parentId: base.parentId, valueType: "enum", value });
      continue;
    }
    if (draft.valueType !== "range" || draft.min === null || draft.max === null) {
      records.push({ id: base.id, name: base.name, parentId: base.parentId, valueType: "range", value: null });
      continue;
    }
    records.push({ id: base.id, name: base.name, parentId: base.parentId, valueType: "range", value: { min: draft.min, max: draft.max } });
  }
  return records;
}

/**
 * @description 从属性草稿 selectedRecords 解析已选 id 列表。
 * @param selected 草稿中的选中记录。
 * @returns id 列表。
 */
export function listSelectedAttributeMetadataIds(selected: unknown): string[] {
  if (!Array.isArray(selected)) return [];
  return selected.flatMap((item) => (item && typeof item === "object" && "id" in item && typeof item.id === "string" ? [item.id] : []));
}

/**
 * @description 打开弹窗时按目录与已选记录初始化值草稿表。
 * @param catalog 目录扁平记录。
 * @param selectedRecords 已选记录。
 * @returns id → 值草稿。
 */
export function initializeAttributeMetadataValueDrafts(
  catalog: OntologyAttributeMetadataRecord[],
  selectedRecords: unknown,
): Record<string, AttributeMetadataValueDraft> {
  const selectedById = new Map<string, OntologyAttributeMetadataRecord>();
  if (Array.isArray(selectedRecords)) {
    for (const item of selectedRecords) {
      if (!item || typeof item !== "object" || !("id" in item) || typeof item.id !== "string") continue;
      if (!("valueType" in item)) continue;
      selectedById.set(item.id, item as OntologyAttributeMetadataRecord);
    }
  }
  const drafts: Record<string, AttributeMetadataValueDraft> = {};
  for (const item of catalog) {
    drafts[item.id] = createAttributeMetadataValueDraft(selectedById.get(item.id) ?? item);
  }
  return drafts;
}

/**
 * @description 将选中元数据叶节点格式化为嵌套 JSON 叶值字符串。
 * @param record 选中记录。
 * @returns 叶值文本；输入值保持字符串，枚举用英文逗号拼接，范围用 min,max。
 */
export function formatAttributeMetadataLeafValue(record: OntologyAttributeMetadataRecord): string {
  if (record.valueType === "input") return record.value.trim();
  if (record.valueType === "enum")
    return record.value
      .map((item) => item.trim())
      .filter(Boolean)
      .join(",");
  if (!record.value) return "";
  return `${record.value.min},${record.value.max}`;
}

/**
 * @description 按目录 parentId 回溯祖先名称（自根到父）。
 * @param record 选中记录。
 * @param catalogById 目录索引。
 * @returns 祖先名称列表。
 */
function listAttributeMetadataAncestorNames(record: OntologyAttributeMetadataRecord, catalogById: Map<string, OntologyAttributeMetadataRecord>): string[] {
  const names: string[] = [];
  const visited = new Set<string>();
  let parentId = record.parentId.trim();
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = catalogById.get(parentId);
    if (!parent) break;
    names.push(parent.name);
    parentId = parent.parentId.trim();
  }
  return names.reverse();
}

/**
 * @description 沿名称路径写入嵌套对象。
 * @param root 嵌套根对象。
 * @param path 名称路径。
 * @param leafValue 叶值。
 */
function writeAttributeMetadataNestedPath(root: Record<string, unknown>, path: string[], leafValue: string): void {
  let cursor = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    if (!key) continue;
    const current = cursor[key];
    if (!current || typeof current !== "object" || Array.isArray(current)) cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  const leafKey = path[path.length - 1];
  if (leafKey) cursor[leafKey] = leafValue;
}

/**
 * @description 将选中元数据组装为接口所需的名称路径嵌套 JSON。
 * @param selectedRecords 选中并已编辑值的记录。
 * @param catalog 完整目录，用于补全父级名称。
 * @returns 形如 `{ 元数据: { aaa: { rrr: "3" } } }`。
 */
export function buildAttributeMetadataNestedJson(
  selectedRecords: OntologyAttributeMetadataRecord[],
  catalog: OntologyAttributeMetadataRecord[],
): Record<string, unknown> {
  const tree: Record<string, unknown> = {};
  const catalogById = new Map(catalog.map((item) => [item.id, item]));
  for (const record of selectedRecords) {
    const path = [...listAttributeMetadataAncestorNames(record, catalogById), record.name].map((name) => name.trim()).filter(Boolean);
    if (!path.length) continue;
    writeAttributeMetadataNestedPath(tree, path, formatAttributeMetadataLeafValue(record));
  }
  if (Object.keys(tree).length === 1 && ATTRIBUTE_METADATA_NESTED_ROOT_KEY in tree) return tree;
  return { [ATTRIBUTE_METADATA_NESTED_ROOT_KEY]: tree };
}

/**
 * @description 组装属性草稿中的元数据 UI 状态与提交用 nested。
 * @param selectedRecords 选中记录。
 * @param catalog 目录快照。
 * @param nested 可选预计算 nested；缺省时按目录生成。
 * @returns 草稿 metadata 状态。
 */
export function buildAttributeMetadataDraftState(
  selectedRecords: OntologyAttributeMetadataRecord[],
  catalog: OntologyAttributeMetadataRecord[],
  nested?: Record<string, unknown>,
): AttributeMetadataDraftState {
  return {
    selectedRecords,
    catalog,
    nested: nested ?? buildAttributeMetadataNestedJson(selectedRecords, catalog),
  };
}

/**
 * @description 判断值是否为属性元数据草稿状态。
 * @param value 待判断值。
 * @returns 是否为草稿状态。
 */
export function isAttributeMetadataDraftState(value: unknown): value is AttributeMetadataDraftState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.selectedRecords) &&
    Array.isArray(candidate.catalog) &&
    !!candidate.nested &&
    typeof candidate.nested === "object" &&
    !Array.isArray(candidate.nested)
  );
}

/**
 * @description 从未知载荷中提取可识别的选中元数据记录。
 * @param records 未知记录列表。
 * @returns 合法记录。
 */
export function listAttributeMetadataSelectedRecords(records: unknown[]): OntologyAttributeMetadataRecord[] {
  const selected: OntologyAttributeMetadataRecord[] = [];
  for (const item of records) {
    if (!item || typeof item !== "object") continue;
    if (!("id" in item) || typeof item.id !== "string") continue;
    if (!("name" in item) || typeof item.name !== "string") continue;
    if (!("parentId" in item) || typeof item.parentId !== "string") continue;
    if (!("valueType" in item)) continue;
    if (item.valueType === "input" && "value" in item && typeof item.value === "string") {
      selected.push({ id: item.id, name: item.name, parentId: item.parentId, valueType: "input", value: item.value });
      continue;
    }
    if (item.valueType === "enum" && "value" in item && Array.isArray(item.value)) {
      selected.push({
        id: item.id,
        name: item.name,
        parentId: item.parentId,
        valueType: "enum",
        value: item.value.filter((entry): entry is string => typeof entry === "string"),
      });
      continue;
    }
    if (item.valueType === "range") {
      const rangeValue =
        "value" in item && item.value && typeof item.value === "object" && !Array.isArray(item.value) && "min" in item.value && "max" in item.value
          ? {
              min: typeof item.value.min === "number" ? item.value.min : null,
              max: typeof item.value.max === "number" ? item.value.max : null,
            }
          : null;
      selected.push({
        id: item.id,
        name: item.name,
        parentId: item.parentId,
        valueType: "range",
        value: rangeValue && rangeValue.min !== null && rangeValue.max !== null ? { min: rangeValue.min, max: rangeValue.max } : null,
      });
    }
  }
  return selected;
}

/**
 * @description 从属性草稿 metadata 解析提交给接口的 JSON 字符串。
 * @param metadata 草稿 metadata。
 * @returns 非空 nested 的 JSON 字符串；否则 undefined。
 */
export function resolveAttributeMetadataApiPayload(metadata: Record<string, unknown> | null | undefined): string | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
  const nested = metadata.nested;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const root = (nested as Record<string, unknown>)[ATTRIBUTE_METADATA_NESTED_ROOT_KEY];
    if (root && typeof root === "object" && !Array.isArray(root) && Object.keys(root).length) return JSON.stringify(nested);
  }
  if (ATTRIBUTE_METADATA_NESTED_ROOT_KEY in metadata && !("selectedRecords" in metadata)) {
    const root = metadata[ATTRIBUTE_METADATA_NESTED_ROOT_KEY];
    if (root && typeof root === "object" && !Array.isArray(root) && Object.keys(root).length) return JSON.stringify(metadata);
  }
  return undefined;
}

/** 嵌套 JSON 中收集到的叶路径与原始叶值。 */
type AttributeMetadataNestedLeafEntry = {
  path: string[];
  rawValue: string;
};

/**
 * @description 递归收集嵌套 metadata 中的叶路径与叶值。
 * @param node 当前节点。
 * @param path 当前名称路径。
 * @param entries 输出列表。
 */
function collectAttributeMetadataNestedLeafEntries(node: unknown, path: string[], entries: AttributeMetadataNestedLeafEntry[]): void {
  if (node === null || node === undefined) return;
  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
    if (!path.length) return;
    entries.push({ path: [...path], rawValue: String(node) });
    return;
  }
  if (typeof node !== "object" || Array.isArray(node)) return;
  for (const [key, child] of Object.entries(node)) {
    const nextKey = key.trim();
    if (!nextKey) continue;
    collectAttributeMetadataNestedLeafEntries(child, [...path, nextKey], entries);
  }
}

/**
 * @description 判断两条名称路径是否匹配；允许嵌套根键「元数据」前缀可有可无。
 * @param left 路径 A。
 * @param right 路径 B。
 * @returns 是否等价。
 */
function isAttributeMetadataNamePathMatch(left: string[], right: string[]): boolean {
  if (left.length === right.length && left.every((item, index) => item === right[index])) return true;
  const stripRoot = (path: string[]): string[] => (path[0] === ATTRIBUTE_METADATA_NESTED_ROOT_KEY ? path.slice(1) : path);
  const normalizedLeft = stripRoot(left);
  const normalizedRight = stripRoot(right);
  return normalizedLeft.length === normalizedRight.length && normalizedLeft.every((item, index) => item === normalizedRight[index]);
}

/**
 * @description 将嵌套叶值还原为目录叶子记录上的取值。
 * @param base 目录叶子。
 * @param rawValue 嵌套 JSON 叶值文本。
 * @returns 带回显值的选中记录。
 */
function applyAttributeMetadataNestedLeafValue(base: OntologyAttributeMetadataRecord, rawValue: string): OntologyAttributeMetadataRecord {
  const text = rawValue.trim();
  if (base.valueType === "input") {
    return { id: base.id, name: base.name, parentId: base.parentId, valueType: "input", value: text };
  }
  if (base.valueType === "enum") {
    const value = text
      ? text
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    return { id: base.id, name: base.name, parentId: base.parentId, valueType: "enum", value };
  }
  if (!text) {
    return { id: base.id, name: base.name, parentId: base.parentId, valueType: "range", value: null };
  }
  const [minText = "", maxText = ""] = text.split(",");
  const min = Number(minText.trim());
  const max = Number(maxText.trim());
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { id: base.id, name: base.name, parentId: base.parentId, valueType: "range", value: null };
  }
  return { id: base.id, name: base.name, parentId: base.parentId, valueType: "range", value: { min, max } };
}

/**
 * @description 将嵌套 metadata JSON 按名称路径匹配目录树末端节点并还原选中记录。
 * @param nested 嵌套 metadata 对象。
 * @param catalog 完整目录。
 * @returns 回显用选中记录；无法匹配时跳过。
 */
export function parseAttributeMetadataNestedSelection(
  nested: Record<string, unknown>,
  catalog: OntologyAttributeMetadataRecord[],
): OntologyAttributeMetadataRecord[] {
  const entries: AttributeMetadataNestedLeafEntry[] = [];
  collectAttributeMetadataNestedLeafEntries(nested, [], entries);
  if (!entries.length) return [];
  const catalogById = new Map(catalog.map((item) => [item.id, item]));
  const parentIds = new Set(catalog.map((item) => item.parentId).filter((item) => item.trim()));
  const leafCandidates = catalog.filter((item) => !parentIds.has(item.id));
  const usedIds = new Set<string>();
  const selected: OntologyAttributeMetadataRecord[] = [];
  for (const entry of entries) {
    const matched = leafCandidates.find((item) => {
      if (usedIds.has(item.id)) return false;
      const path = [...listAttributeMetadataAncestorNames(item, catalogById), item.name].map((name) => name.trim()).filter(Boolean);
      return isAttributeMetadataNamePathMatch(path, entry.path);
    });
    if (!matched) continue;
    usedIds.add(matched.id);
    selected.push(applyAttributeMetadataNestedLeafValue(matched, entry.rawValue));
  }
  return selected;
}

/**
 * @description 从属性草稿或接口嵌套 metadata 解析选择弹窗回显记录。
 * @param metadataSource 草稿 metadata 或嵌套 JSON。
 * @param catalog 当前目录。
 * @returns 选中记录列表。
 */
export function resolveAttributeMetadataSelectionEcho(metadataSource: unknown, catalog: OntologyAttributeMetadataRecord[]): OntologyAttributeMetadataRecord[] {
  if (!metadataSource || typeof metadataSource !== "object" || Array.isArray(metadataSource)) return [];
  const source = metadataSource as Record<string, unknown>;
  if ("selectedRecords" in source && Array.isArray(source.selectedRecords)) {
    return listAttributeMetadataSelectedRecords(source.selectedRecords);
  }
  if (source.nested && typeof source.nested === "object" && !Array.isArray(source.nested)) {
    return parseAttributeMetadataNestedSelection(source.nested as Record<string, unknown>, catalog);
  }
  if (ATTRIBUTE_METADATA_NESTED_ROOT_KEY in source) {
    return parseAttributeMetadataNestedSelection(source, catalog);
  }
  return [];
}
