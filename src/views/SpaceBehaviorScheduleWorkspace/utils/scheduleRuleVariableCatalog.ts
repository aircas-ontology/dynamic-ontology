import type { RuleVariableCatalogObject, RuleVariablePropertyOption, RuleVariablePropertyValueType } from "@/types";

let catalogSeq = 0;

/**
 * @description 生成自定义变量或键标识。
 * @param prefix 标识前缀。
 * @returns 标识。
 */
function createCatalogId(prefix: string): string {
  catalogSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${catalogSeq.toString(36)}`;
}

/**
 * @description 创建截图样例变量目录。
 * @returns 初始自定义变量列表。
 */
function createSeedCatalog(): RuleVariableCatalogObject[] {
  return [
    {
      id: "var-global-task",
      name: "全局任务上下文",
      kind: "object",
      category: "custom",
      properties: [
        { id: "key-priority", name: "任务优先级", valueType: "string" },
        { id: "key-stage", name: "当前阶段", valueType: "string" },
        { id: "key-alarm", name: "告警开关", valueType: "boolean" },
        { id: "key-duty", name: "值班席位", valueType: "string" },
      ],
    },
    {
      id: "var-system-runtime",
      name: "系统运行参数",
      kind: "object",
      category: "custom",
      properties: [{ id: "key-sample-interval", name: "采样间隔", valueType: "number" }],
    },
    {
      id: "var-env-threshold",
      name: "环境阈值",
      kind: "object",
      category: "custom",
      properties: [{ id: "key-distance", name: "距离阈值", valueType: "number" }],
    },
  ];
}

let catalog: RuleVariableCatalogObject[] = createSeedCatalog();

/**
 * @description 深拷贝当前自定义变量目录。
 * @returns 目录副本。
 */
export function listCustomRuleVariableCatalog(): RuleVariableCatalogObject[] {
  return structuredClone(catalog);
}

/**
 * @description 把目录恢复为截图样例，供测试隔离会话状态。
 */
export function resetCustomRuleVariableCatalog(): void {
  catalogSeq = 0;
  catalog = createSeedCatalog();
}

/**
 * @description 收集键名称（含嵌套子键）。
 * @param properties 键列表。
 * @returns 名称列表。
 */
function collectPropertyNames(properties: RuleVariablePropertyOption[]): string[] {
  return properties.flatMap((item) => [item.name, ...collectPropertyNames(item.children ?? [])]);
}

/**
 * @description 按名称或键过滤自定义变量。
 * @param keyword 搜索关键字。
 * @returns 匹配的变量列表。
 */
export function filterCustomRuleVariableCatalog(keyword: string): RuleVariableCatalogObject[] {
  const normalized = keyword.trim().toLowerCase();
  const source = listCustomRuleVariableCatalog();
  if (!normalized) return source;
  return source.filter((item) => {
    if (item.name.toLowerCase().includes(normalized)) return true;
    return collectPropertyNames(item.properties).some((name) => name.toLowerCase().includes(normalized));
  });
}

/**
 * @description 按标识查找变量。
 * @param objectId 变量标识。
 * @returns 变量；不存在时为空。
 */
function findCatalogObject(objectId: string): RuleVariableCatalogObject | undefined {
  return catalog.find((item) => item.id === objectId);
}

/**
 * @description 新增自定义变量。
 * @param name 变量名称。
 * @returns 新建变量。
 */
export function createCustomRuleVariableObject(name: string): RuleVariableCatalogObject {
  const created: RuleVariableCatalogObject = {
    id: createCatalogId("var"),
    name: name.trim(),
    kind: "object",
    category: "custom",
    properties: [],
  };
  catalog.push(created);
  return structuredClone(created);
}

/**
 * @description 更新自定义变量名称。
 * @param objectId 变量标识。
 * @param name 新名称。
 * @returns 更新后的变量。
 */
export function updateCustomRuleVariableObject(objectId: string, name: string): RuleVariableCatalogObject {
  const target = findCatalogObject(objectId);
  if (!target) {
    throw new Error("自定义变量不存在");
  }
  target.name = name.trim();
  return structuredClone(target);
}

/**
 * @description 删除自定义变量及其键。
 * @param objectId 变量标识。
 * @returns 是否删除成功。
 */
export function deleteCustomRuleVariableObject(objectId: string): boolean {
  const index = catalog.findIndex((item) => item.id === objectId);
  if (index < 0) return false;
  catalog.splice(index, 1);
  return true;
}

/**
 * @description 为变量添加键。
 * @param objectId 变量标识。
 * @param name 键名称。
 * @param valueType 值类型。
 * @param children 对象类型子键。
 * @returns 新建键。
 */
export function createCustomRuleVariableProperty(
  objectId: string,
  name: string,
  valueType: RuleVariablePropertyValueType,
  children: RuleVariablePropertyOption[] = [],
): RuleVariablePropertyOption {
  const target = findCatalogObject(objectId);
  if (!target) {
    throw new Error("自定义变量不存在");
  }
  const created: RuleVariablePropertyOption = {
    id: createCatalogId("key"),
    name: name.trim(),
    valueType,
    children: valueType === "object" && children.length ? structuredClone(children) : undefined,
  };
  target.properties.push(created);
  return structuredClone(created);
}

/**
 * @description 更新变量下的键。
 * @param objectId 变量标识。
 * @param propertyId 键标识。
 * @param name 键名称。
 * @param valueType 值类型。
 * @param children 对象类型子键。
 * @returns 更新后的键。
 */
export function updateCustomRuleVariableProperty(
  objectId: string,
  propertyId: string,
  name: string,
  valueType: RuleVariablePropertyValueType,
  children: RuleVariablePropertyOption[] = [],
): RuleVariablePropertyOption {
  const target = findCatalogObject(objectId);
  const property = target?.properties.find((item) => item.id === propertyId);
  if (!target || !property) {
    throw new Error("键不存在");
  }
  property.name = name.trim();
  property.valueType = valueType;
  property.children = valueType === "object" && children.length ? structuredClone(children) : undefined;
  return structuredClone(property);
}

/**
 * @description 删除变量下的键。
 * @param objectId 变量标识。
 * @param propertyId 键标识。
 * @returns 是否删除成功。
 */
export function deleteCustomRuleVariableProperty(objectId: string, propertyId: string): boolean {
  const target = findCatalogObject(objectId);
  if (!target) return false;
  const index = target.properties.findIndex((item) => item.id === propertyId);
  if (index < 0) return false;
  target.properties.splice(index, 1);
  return true;
}
