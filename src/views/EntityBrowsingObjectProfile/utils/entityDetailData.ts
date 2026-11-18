import type {
  GetOntologyObjectArrTypeTreeData,
  OntologyEntityLinkItem,
  OntologyRelationClass,
  GetOntologyEntityRowDetailData,
  GetOntologyEntityRowDetailParams,
  ObjectProfileEntityCategory,
  ObjectProfileEntityProperty,
  ObjectProfileEntityListProperty,
} from "@/types";

/** @description 保留空、布尔、数值与复杂值的原始语义。 @param value 属性值。 @returns 展示文本。 */
function formatEntityValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

/** @description 展开存储分组和动态属性行，不合并重复属性。 @param detail 实体详情。 @returns 属性展示行。 */
export function buildEntityPropertyRows(detail: GetOntologyEntityRowDetailData): ObjectProfileEntityProperty[] {
  return (detail?.propertyGroups ?? []).flatMap((group, groupIndex) =>
    (group.groupDataList ?? []).flatMap((record, recordIndex) =>
      (record.props ?? []).map((property, propertyIndex) => ({
        id: `${groupIndex}-${recordIndex}-${propertyIndex}`,
        recordId: `${groupIndex}-${recordIndex}`,
        propertyId: property.propertyUniqIdentifier ?? "",
        name: property.propertyDisplayName || property.propertyApiName || property.propertyUniqIdentifier || "未命名属性",
        value: formatEntityValue(property.propertyValue),
        categoryId: property.categoryId === null || property.categoryId === undefined ? "" : String(property.categoryId),
        storageGroup: group.storageGroup,
        dataPrimaryKey: formatEntityValue(record.dataPrimaryKey),
      })),
    ),
  );
}

/** @description 将对象分类树映射为详情只读导航。 @param root 分类树根。 @returns 分类节点。 */
export function buildEntityCategoryTree(root: GetOntologyObjectArrTypeTreeData | null): ObjectProfileEntityCategory[] {
  if (!root) return [];
  return [
    {
      id: String(root.categoryId),
      label: root.name || "属性分类",
      propertyNames: (root.propertyInfos ?? []).flatMap((property) => [property.displayName, property.apiName].filter((name): name is string => Boolean(name))),
      propertyIds: (root.propertyInfos ?? []).flatMap((property) => (property.uniqueIdentifier ? [property.uniqueIdentifier] : [])),
      children: (root.children ?? []).flatMap((child) => buildEntityCategoryTree(child)),
    },
  ];
}

/** @description 筛选选中分类及所有子类的属性。 @param rows 属性行。 @param tree 分类树。 @param categoryId 分类标识。 @returns 匹配行。 */
export function filterEntityPropertyRows(
  rows: ObjectProfileEntityProperty[],
  tree: ObjectProfileEntityCategory[],
  categoryId: string,
): ObjectProfileEntityProperty[] {
  if (categoryId === "all") return rows;
  const ids = new Set<string>([categoryId]);
  const propertyIds = new Set<string>();
  /** @description 递归收集选中分类的后代。 @param nodes 分类节点。 @param included 父类是否已选。 */
  function collectCategoryIds(nodes: ObjectProfileEntityCategory[], included = false): void {
    nodes.forEach((node) => {
      const selected = included || node.id === categoryId;
      if (selected) {
        ids.add(node.id);
        node.propertyIds.forEach((id) => propertyIds.add(id));
      }
      collectCategoryIds(node.children, selected);
    });
  }
  collectCategoryIds(tree);
  return rows.filter((row) => ids.has(row.categoryId) || (!row.categoryId && propertyIds.has(row.propertyId)));
}

/** @description 解析列表中的复合主键，普通字符串（包括前导零）原样传递。 @param instanceId 实体主键文本。 @returns 接口主键。 */
export function parseEntityPrimaryKey(instanceId: string): GetOntologyEntityRowDetailParams["entityPrimaryKey"] {
  const text = instanceId.trim();
  if (!text) throw new Error("缺少实体主键");
  if (!text.startsWith("{")) return text;
  try {
    const value: unknown = JSON.parse(text);
    if (value && typeof value === "object" && !Array.isArray(value)) return Object.fromEntries(Object.entries(value));
  } catch {
    throw new Error("实体主键格式无效");
  }
  throw new Error("实体主键格式无效");
}

/** @description 仅将选中实体列表里的真实属性转为降级展示行，按分类字段名归属。 @param items 列表属性。 @param categories 对象分类树。 @returns 可展示属性行。 */
export function buildEntityListPropertyRows(
  items: ObjectProfileEntityListProperty[],
  categories: ObjectProfileEntityCategory[],
): ObjectProfileEntityProperty[] {
  const categoryByName = new Map<string, string>();
  /** @description 遍历分类，建立属性名称到分类的映射。 @param nodes 分类节点。 */
  function collectPropertyNames(nodes: ObjectProfileEntityCategory[]): void {
    nodes.forEach((node) => {
      (node.propertyNames ?? []).forEach((name) => categoryByName.set(name, node.id));
      collectPropertyNames(node.children);
    });
  }
  collectPropertyNames(categories);
  return items.map((item, index) => ({
    id: `list-${index}`,
    recordId: "list",
    propertyId: "",
    name: item.label,
    value: item.value === "" ? "—" : item.value,
    categoryId: categoryByName.get(item.label) ?? "",
    storageGroup: "main",
    dataPrimaryKey: "—",
  }));
}

/** @description 将筛选后的属性按存储组和原始数据记录组合，保留顺序及重复属性。 @param rows 属性行。 @returns 分组及记录内的键值对。 */
export function groupEntityPropertyRows(rows: ObjectProfileEntityProperty[]) {
  const groups = new Map<string, { name: string; records: { id: string; dataPrimaryKey: string; properties: ObjectProfileEntityProperty[] }[] }>();
  for (const row of rows) {
    let group = groups.get(row.storageGroup);
    if (!group) {
      group = { name: row.storageGroup, records: [] };
      groups.set(row.storageGroup, group);
    }
    const recordId = row.recordId ?? row.dataPrimaryKey;
    let record = group.records.find((item) => item.id === recordId);
    if (!record) {
      record = { id: recordId, dataPrimaryKey: row.dataPrimaryKey, properties: [] };
      group.records.push(record);
    }
    record.properties.push(row);
  }
  return [...groups.values()];
}

/** @description 将子表记录转为动态属性列和数据行，缺失值补占位符，重复属性值按原顺序保留。 @param records 同一存储分组的记录。 @returns 表格列及数据行。 */
export function buildEntityPropertyTable(records: ReturnType<typeof groupEntityPropertyRows>[number]["records"]) {
  const columns: { id: string; label: string }[] = [];
  for (const record of records) {
    for (const property of record.properties) {
      const id = property.propertyId ? `id:${property.propertyId}` : `name:${property.name}`;
      if (!columns.some((column) => column.id === id)) columns.push({ id, label: property.name });
    }
  }
  const rows = records.map((record) => ({
    id: record.id,
    dataPrimaryKey: record.dataPrimaryKey,
    cells: columns.map((column) => {
      const values = record.properties.filter((property) => (property.propertyId ? `id:${property.propertyId}` : `name:${property.name}`) === column.id);
      return values.length ? values.map((property) => property.value).join("\n") : "—";
    }),
  }));
  return { columns, rows };
}

/** @description 将接口有向关系转换为现有只读图输入，同名不同实例补充身份以免合并。 @param links 接口关系数组。 @returns 图关系记录，不虚构缺失端点。 */
export function buildEntityRelationRows(links: OntologyEntityLinkItem[]): OntologyRelationClass[] {
  const endpoints = new Map<string, string>();
  /** @description 解析端点的稳定身份及展示名，保留 false 和 0。 @param link 关系。 @param side 端点方向。 @returns 有效端点或空。 */
  function resolveEntityEndpoint(link: OntologyEntityLinkItem, side: "From" | "To"): { id: string; name: string } | null {
    const objectId = link[side === "From" ? "ontologyFrom" : "ontologyTo"] ?? "";
    const primaryKey = link[side === "From" ? "entityPrimaryKeyFrom" : "entityPrimaryKeyTo"];
    const nodeId = link[side === "From" ? "entityNodeFrom" : "entityNodeTo"]?.trim();
    if (primaryKey == null && !nodeId) return null;
    const id = JSON.stringify([objectId, primaryKey ?? nodeId]);
    const name = link[side === "From" ? "displayNameFrom" : "displayNameTo"]?.trim() || nodeId || id;
    if (!endpoints.has(id)) endpoints.set(id, name);
    return { id, name };
  }
  const rows = links.flatMap((link, index) => {
    const from = resolveEntityEndpoint(link, "From");
    const to = resolveEntityEndpoint(link, "To");
    return from && to ? [{ link, index, from, to }] : [];
  });
  const names = new Map<string, number>();
  for (const name of endpoints.values()) names.set(name, (names.get(name) ?? 0) + 1);
  /** @description 为重复显示名附加稳定端点身份。 @param id 端点身份。 @returns 唯一展示名。 */
  function resolveEndpointLabel(id: string): string {
    const name = endpoints.get(id) ?? id;
    return (names.get(name) ?? 0) > 1 ? name + " · " + id : name;
  }
  return rows.map(({ link, index, from, to }) => ({
    id: JSON.stringify([from.id, to.id, link.linkName, index]),
    categoryId: "",
    categoryName: "未分类",
    displayName: link.linkName || link.linkType || "关系",
    apiName: "",
    sourceName: resolveEndpointLabel(from.id),
    targetName: resolveEndpointLabel(to.id),
    sourceOntologyId: link.ontologyFrom ?? "",
    targetOntologyId: link.ontologyTo ?? "",
    // 现有只读图不消费基数字段，此值仅兼容输入类型，不代表接口实际基数。
    cardinality: "多对多",
    description: "",
  }));
}
