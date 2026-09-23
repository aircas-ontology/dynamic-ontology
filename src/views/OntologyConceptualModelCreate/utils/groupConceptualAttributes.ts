/** 概念画布上参与分组展示的属性。 */
export interface ConceptualModelGraphAttribute {
  id: number;
  displayName: string;
  apiName: string;
  dataType: string;
  storageGroup: string;
  isPrimary: boolean;
  isNameKey: boolean;
}

/** 按存储分组归类后的属性。 */
export interface ConceptualModelAttributeGroup {
  storageGroup: string;
  attributes: ConceptualModelGraphAttribute[];
}

const HEADER_HEIGHT = 64;
const GROUP_HEADER_HEIGHT = 22;
const ROW_HEIGHT = 26;
const FOOTER_HEIGHT = 32;

/**
 * @description 空存储分组按 main 处理。
 * @param value 存储分组。
 * @returns 可用于展示的分组名。
 */
export function normalizeConceptualStorageGroup(value: string | undefined): string {
  const group = value?.trim();
  return group || "main";
}

/**
 * @description 按存储分组归类属性。main 在最前，其余分组按首次出现顺序；没有属性时只保留空的 main。
 * @param attributes 对象属性。
 * @returns 分组后的属性。
 */
export function groupConceptualAttributesByStorage(attributes: ConceptualModelGraphAttribute[]): ConceptualModelAttributeGroup[] {
  if (!attributes.length) return [{ storageGroup: "main", attributes: [] }];
  const groups = new Map<string, ConceptualModelGraphAttribute[]>();
  for (const attribute of attributes) {
    const storageGroup = normalizeConceptualStorageGroup(attribute.storageGroup);
    const current = groups.get(storageGroup);
    if (current) current.push(attribute);
    else groups.set(storageGroup, [attribute]);
  }
  const ordered: ConceptualModelAttributeGroup[] = [];
  const main = groups.get("main");
  if (main) ordered.push({ storageGroup: "main", attributes: main });
  for (const [storageGroup, groupAttributes] of groups) {
    if (storageGroup === "main") continue;
    ordered.push({ storageGroup, attributes: groupAttributes });
  }
  return ordered;
}

/**
 * @description 生成主键和名称键在画布属性名后的标识。
 * @param attribute 属性键标记。
 * @returns （主）、（名）或两者拼接；都未勾选时为空。
 */
export function formatConceptualAttributeKeyMarks(attribute: Pick<ConceptualModelGraphAttribute, "isPrimary" | "isNameKey">): string {
  const marks: string[] = [];
  if (attribute.isPrimary) marks.push("（主）");
  if (attribute.isNameKey) marks.push("（名）");
  return marks.join("");
}

/** 概念画布属性的主键或名称键。 */
export type ConceptualAttributeKeyKind = "primary" | "name";

/** 参与概念画布主键和名称键冲突判断的属性。 */
export type ConceptualAttributeKeyOwner = Pick<ConceptualModelGraphAttribute, "id" | "displayName" | "apiName" | "isPrimary" | "isNameKey">;

/**
 * @description 查找当前对象里已经占用主键或名称键的其他属性。
 * @param attributes 当前对象的全部属性。
 * @param kind 要设置的键类型。
 * @param editingAttributeId 正在设置的属性 id。
 * @returns 已占用该键的其他属性；没有冲突时返回 null。
 */
export function findConflictingConceptualAttributeKey(
  attributes: ConceptualAttributeKeyOwner[],
  kind: ConceptualAttributeKeyKind,
  editingAttributeId: number,
): ConceptualAttributeKeyOwner | null {
  return (
    attributes.find((item) => {
      if (item.id === editingAttributeId) return false;
      return kind === "primary" ? item.isPrimary : item.isNameKey;
    }) ?? null
  );
}

/**
 * @description 生成概念画布主键或名称键重复时的提示文案。
 * @param kind 冲突的键类型。
 * @param attribute 已经占用该键的属性。
 * @returns 提示用户不能再设置第二个主键或名称键。
 */
export function formatConceptualAttributeKeyConflictMessage(
  kind: ConceptualAttributeKeyKind,
  attribute: Pick<ConceptualAttributeKeyOwner, "displayName" | "apiName">,
): string {
  const name = attribute.displayName.trim() || attribute.apiName.trim() || "未命名属性";
  const label = kind === "primary" ? "主键" : "名称键";
  return `当前对象已存在${label}「${name}」，不能同时设置两个${label}`;
}

/**
 * @description 按存储分组标题和属性行计算对象节点高度。
 * @param attributes 对象属性。
 * @returns 节点高度。
 */
export function conceptualObjectHeight(attributes: ConceptualModelGraphAttribute[]): number {
  const groups = groupConceptualAttributesByStorage(attributes);
  const contentRows = attributes.length === 0 ? 1 : attributes.length;
  return HEADER_HEIGHT + groups.length * GROUP_HEADER_HEIGHT + contentRows * ROW_HEIGHT + FOOTER_HEIGHT;
}
