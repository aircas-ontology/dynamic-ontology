const ASSET_API_NAME_TERMS: Readonly<Record<string, string>> = {
  军民通用资源品种标识代码: "resourceTypeCode",
  分类代码: "categoryCode",
  分类名称: "categoryName",
  基准名称: "standardName",
  名称: "name",
  颜色: "color",
  用途: "purpose",
  类型: "type",
  数量: "quantity",
  单位: "unit",
  编号: "number",
  代码: "code",
  名称代码: "nameCode",
  日期: "date",
  时间: "time",
  地址: "address",
  状态: "status",
  说明: "description",
  备注: "remark",
  别名: "alias",
  中文船名: "chineseShipName",
  英文船名: "englishShipName",
};

/**
 * @description 将资产数据元名称转换为第二步展示使用的英文 API 名称。
 * @param name 数据元中文名称。
 * @param shortName 数据元中文简称；为空时回退到数据元名称。
 * @param id 数据元标识符，用于未配置术语时生成稳定兜底名称。
 * @returns camelCase 英文 API 名称。
 */
export function createAssetPropertyApiName(name: string, id: string, shortName = ""): string {
  const normalizedName = (shortName.trim() || name.trim()).replace(/[（(].*?[）)]/g, "");
  const exactName = ASSET_API_NAME_TERMS[normalizedName];
  if (exactName) return exactName;

  const matchedTerms = Object.entries(ASSET_API_NAME_TERMS)
    .filter(([term]) => normalizedName.includes(term))
    .sort(([left], [right]) => right.length - left.length)
    .map(([, value]) => value);
  if (matchedTerms.length > 0) {
    return [...new Set(matchedTerms)].join("");
  }

  return `dataElement${id.replace(/[^A-Za-z0-9]/g, "")}`;
}

/**
 * @description 为重复 API 名称追加数据元标识符，保证同一资产模型内名称唯一。
 * @param properties 资产属性列表。
 * @returns API 名称唯一的资产属性列表。
 */
export function ensureUniqueAssetPropertyApiNames<T extends { apiName: string; id: string }>(properties: T[]): T[] {
  const counts = new Map<string, number>();
  return properties.map((property) => {
    const count = counts.get(property.apiName) ?? 0;
    counts.set(property.apiName, count + 1);
    return count === 0 ? property : { ...property, apiName: `${property.apiName}${property.id.replace(/[^A-Za-z0-9]/g, "")}` };
  });
}
