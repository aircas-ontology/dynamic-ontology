import type {
  AssetModelDetail,
  AssetModelProperty,
  AssetObjectPropertyDraft,
  BuildOntologyAssetParams,
  BuildOntologyAssetProperty,
  OntologyObjectCreateDraft,
} from "@/types";

/** 资产构建本地配置结果（待专用创建接口接入）。 */
export interface AssetModelBuildConfiguration {
  modelId: string;
  draft: OntologyObjectCreateDraft;
  properties: AssetObjectPropertyDraft[];
}

/** 可选择的对象属性数据类型。 */
export const ASSET_PROPERTY_DATA_TYPES = ["Boolean", "Int", "Long", "Float", "Short", "Byte", "Double", "Decimal", "String", "Date", "Array", "Timestamp"];

/**
 * @description 将资产数据元的数据类型转换为对象属性枚举；无法确定的类型要求手动选择。
 * @param sourceType 数据元类型。
 * @returns 对象属性类型，无法映射时为空字符串。
 */
export function mapAssetPropertyDataType(sourceType: string): string {
  switch (sourceType.trim()) {
    case "字符串型":
      return "String";
    case "数值型":
    case "数字型":
      return "Int";
    case "日期时间型":
      return "Timestamp";
    default:
      return "";
  }
}

/**
 * @description 根据所选数据元生成属性草稿，保留仍选中行的编辑内容。
 * @param selected 所选数据元及其唯一行标识。
 * @param previous 上一次属性草稿。
 * @returns 独立的可编辑属性列表。
 */
export function buildAssetPropertyDrafts(
  selected: Array<{ key: string; property: AssetModelProperty }>,
  previous: AssetObjectPropertyDraft[],
): AssetObjectPropertyDraft[] {
  const previousByKey = new Map(previous.map((item) => [item.sourceKey, item]));
  return selected.map(({ key, property }) => {
    const existing = previousByKey.get(key);
    if (existing)
      return {
        ...existing,
        ...(existing.enumValues ? { enumValues: [...existing.enumValues] } : {}),
        metaList: existing.metaList.map((meta) => ({ ...meta })),
      };
    return {
      ...property,
      ...(property.enumValues ? { enumValues: [...property.enumValues] } : {}),
      sourceKey: key,
      apiName: property.apiName,
      dataType: mapAssetPropertyDataType(property.dataType),
      defaultValue: "",
      description: property.description,
      isPrimary: false,
      isNameKey: false,
      metaList: property.metaList.map((meta) => ({ ...meta })),
    };
  });
}

/**
 * @description 校验资产标准步骤是否至少勾选一个属性。
 * @param selectedIds 已选属性标识。
 */
export function assertAssetStandardSelection(selectedIds: string[]): void {
  if (!selectedIds.length) throw new Error("请至少选择一个属性");
}

/**
 * @description 按已选标识从资产标准中取出属性列表，供第二步展示与确认创建复用。
 * @param properties 资产模型全部标准属性。
 * @param selectedIds 第一步勾选的属性标识（按勾选顺序，允许重复标识对应多行）。
 * @returns 已选属性列表。
 */
export function pickAssetStandardProperties(properties: AssetModelProperty[], selectedIds: string[]): AssetModelProperty[] {
  const remainingIndexes = new Map<string, number[]>();
  properties.forEach((property, index) => {
    const indexes = remainingIndexes.get(property.id) ?? [];
    indexes.push(index);
    remainingIndexes.set(property.id, indexes);
  });

  const picked: AssetModelProperty[] = [];
  for (const selectedId of selectedIds) {
    const indexes = remainingIndexes.get(selectedId);
    const nextIndex = indexes?.shift();
    if (nextIndex === undefined) continue;
    const property = properties[nextIndex];
    if (property) picked.push(property);
  }
  return picked;
}

/**
 * @description 校验对象信息草稿字段（对齐手动创建必填项）。
 * @param draft 对象信息草稿。
 */
export function assertAssetObjectDraft(draft: OntologyObjectCreateDraft): void {
  if (!draft.displayName.trim()) throw new Error("请输入显示名称");
  if (!draft.apiName.trim()) throw new Error("请输入 API 名称");
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]{0,62}$/.test(draft.apiName.trim())) throw new Error("API 名称格式不正确");
  if (!draft.categoryId) throw new Error("请选择分类");
}

/**
 * @description 校验资产标准与对象信息，并复制选中属性，防止编辑配置污染资产模板。
 * @param detail 资产模板。
 * @param draft 对象信息草稿。
 * @param properties 已编辑的对象属性草稿。
 * @returns 独立的本地模型配置（不发起后端创建）。
 */
export function buildAssetModelConfiguration(
  detail: AssetModelDetail,
  draft: OntologyObjectCreateDraft,
  properties: AssetObjectPropertyDraft[],
): AssetModelBuildConfiguration {
  if (!properties.length) throw new Error("请至少选择一个属性");
  assertAssetObjectDraft(draft);
  const apiNames = new Set<string>();
  for (const property of properties) {
    const apiName = property.apiName.trim();
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]{0,62}$/.test(apiName)) throw new Error(`属性「${property.name}」的 API 名称无效`);
    if (apiNames.has(apiName)) throw new Error(`属性 API 名称「${apiName}」重复`);
    apiNames.add(apiName);
    if (!ASSET_PROPERTY_DATA_TYPES.includes(property.dataType)) throw new Error(`请选择属性「${property.name}」的数据类型`);
  }
  if (properties.filter((property) => property.isNameKey).length > 1) throw new Error("名称键最多选择一个");
  return {
    modelId: detail.id,
    draft: {
      apiName: draft.apiName.trim(),
      displayName: draft.displayName.trim(),
      description: draft.description.trim(),
      iconUrl: draft.iconUrl.trim(),
      categoryId: draft.categoryId,
      parentId: draft.parentId,
    },
    properties: properties.map((property) => ({
      ...property,
      ...(property.enumValues ? { enumValues: [...property.enumValues] } : {}),
      apiName: property.apiName.trim(),
      metaList: property.metaList.map((meta) => ({ ...meta })),
    })),
  };
}

/**
 * @description 将属性元数据列表按原始表头和值完整转换为创建请求中的元数据对象。
 * @param property 资产属性草稿。
 * @returns 元数据，未提供内容时返回 undefined。
 */
function buildAssetPropertyMetadata(property: AssetObjectPropertyDraft): BuildOntologyAssetProperty["metadata"] {
  if (!property.metaList.length) return undefined;
  return { 元数据: Object.fromEntries(property.metaList.map(({ label, value }) => [label, value])) };
}

/**
 * @description 将已校验的资产配置转换为对象创建接口请求。
 * @param configuration 已校验的对象和属性配置。
 * @param spaceId 当前对象空间标识。
 * @returns 资产构建对象接口请求。
 */
export function buildAssetOntologyRequest(configuration: AssetModelBuildConfiguration, spaceId: string): BuildOntologyAssetParams {
  const numericSpaceId = Number(spaceId.trim());
  const numericCategoryId = Number(configuration.draft.categoryId);
  if (!Number.isSafeInteger(numericSpaceId) || numericSpaceId <= 0 || numericSpaceId > 2147483647) throw new Error("缺少有效的空间 ID");
  if (!Number.isSafeInteger(numericCategoryId) || numericCategoryId <= 0 || numericCategoryId > 2147483647) throw new Error("请选择有效的对象分类");
  return {
    spaceId: numericSpaceId,
    displayName: configuration.draft.displayName,
    apiName: configuration.draft.apiName,
    description: configuration.draft.description,
    categoryId: numericCategoryId,
    groupIds: [],
    properties: configuration.properties.map((property) => {
      const metadata = buildAssetPropertyMetadata(property);
      return {
        displayName: property.name,
        apiName: property.apiName,
        description: property.description,
        dataType: property.dataType === "Boolean" ? "Bool" : property.dataType,
        defaultValue: property.defaultValue,
        isPrimaryKey: false,
        isTitleKey: property.isNameKey,
        storageGroup: "main",
        ...(metadata ? { metadata } : {}),
      };
    }),
  };
}
