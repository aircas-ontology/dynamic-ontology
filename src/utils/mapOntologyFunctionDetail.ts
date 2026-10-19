import type {
  FunctionOperator,
  FunctionOperatorAggFunc,
  FunctionOperatorDefinition,
  FunctionOperatorDraft,
  FunctionOperatorParameter,
  FunctionOperatorParameterField,
  FunctionOperatorParameterType,
  GetOntologyFunctionDetailData,
  GetOntologyFunctionDetailParamItem,
} from "@/types";
import { createEmptyBasicFilterDocument, mapOntologyFunctionQueryConfigToBasicFilter, stringifyBasicFilterConfig } from "./functionOperatorBasicFilter.ts";
import { mapScriptLanguageFromApi } from "./mapFunctionOperatorScriptLanguage.ts";
import { mapFunctionOperatorTypeFromApi } from "./mapFunctionOperatorTypeToApi.ts";
import { mapOntologyFunctionPublishStatus } from "./mapOntologyFunctionPublishStatus.ts";

const AGG_FUNC_SET = new Set<string>(["SUM", "COUNT", "AVG", "MAX", "MIN", "DISTINCT"]);

/**
 * @description 解析详情中的聚合类型；空或非法值回落为空字符串。
 * @param value queryConfig.aggFunc。
 * @returns 表单聚合类型或空串。
 */
function resolveAggFunc(value: unknown): FunctionOperatorAggFunc | "" {
  if (typeof value === "string" && AGG_FUNC_SET.has(value)) {
    return value as FunctionOperatorAggFunc;
  }
  return "";
}

/**
 * @description 解析详情中的聚合参数名；非字符串回落为空串。
 * @param value queryConfig.targetProperty。
 * @returns 表单聚合参数名或空串。
 */
function resolveTargetProperty(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @description 将详情 paramType 映射为页面参数类型；未知回落为 string。
 * @param paramType 接口参数类型。
 * @returns 页面参数类型。
 */
function mapDetailParamType(paramType: string | undefined): FunctionOperatorParameterType {
  const normalized = typeof paramType === "string" ? paramType.trim().toUpperCase() : "";
  if (normalized === "NUMBER" || normalized === "INTEGER" || normalized === "LONG" || normalized === "DOUBLE" || normalized === "FLOAT") {
    return "number";
  }
  if (normalized === "BOOLEAN" || normalized === "BOOL") {
    return "boolean";
  }
  if (normalized === "OBJECT") {
    return "object";
  }
  if (normalized === "ARRAY" || normalized === "LIST") {
    return "array";
  }
  return "string";
}

/**
 * @description 将详情参数项（含嵌套 fields）映射为页面参数字段树。
 * @param item 详情参数项。
 * @param index 同层序号。
 * @param parentKey 父级键前缀。
 * @returns 页面参数字段。
 */
function mapDetailParamItemToField(item: GetOntologyFunctionDetailParamItem, index: number, parentKey: string): FunctionOperatorParameterField {
  const name = typeof item.paramName === "string" ? item.paramName.trim() : "";
  const description = typeof item.description === "string" ? item.description.trim() : "";
  const role = typeof item.paramRole === "string" ? item.paramRole.trim() : "";
  const descParts = [description, role ? `角色：${role}` : ""].filter(Boolean);
  const apiParamType = typeof item.paramType === "string" ? item.paramType.trim() : "";
  const id = String(item.paramId ?? `${parentKey}-${name || "param"}-${index}`);
  const nested =
    Array.isArray(item.fields) && item.fields.length > 0
      ? [...item.fields]
          .sort((left, right) => (left.paramOrder ?? 0) - (right.paramOrder ?? 0))
          .map((child, childIndex) => mapDetailParamItemToField(child, childIndex, id))
      : undefined;
  return {
    id,
    name,
    type: mapDetailParamType(item.paramType),
    required: false,
    description: descParts.join("；"),
    apiParamType,
    itemFields: nested,
  };
}

/**
 * @description 按 category 将详情 params 映射为抽屉参数列表；大小写不敏感匹配，递归保留 fields。
 * @param params 详情 params。
 * @param category 目标类别（INPUT / OUTPUT）。
 * @returns 页面参数列表。
 */
function mapDetailParamsByCategory(params: GetOntologyFunctionDetailParamItem[] | undefined, category: "INPUT" | "OUTPUT"): FunctionOperatorParameter[] {
  if (!Array.isArray(params) || !params.length) {
    return [];
  }
  const normalizedCategory = category.toUpperCase();
  return [...params]
    .filter((item) => (typeof item.category === "string" ? item.category.trim().toUpperCase() : "") === normalizedCategory)
    .sort((a, b) => (a.paramOrder ?? 0) - (b.paramOrder ?? 0))
    .map((item, index) => {
      const field = mapDetailParamItemToField(item, index, category.toLowerCase());
      return {
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required,
        description: field.description,
        apiParamType: field.apiParamType,
        itemFields: field.itemFields,
      };
    });
}

/**
 * @description 解析详情参数配置展示文本：优先 queryConfig，其次 code JSON。
 * @param detail 详情 data。
 * @returns 参数配置文本。
 */
function resolveDetailParameterConfig(detail: GetOntologyFunctionDetailData): string {
  if (detail.queryConfig) {
    return stringifyBasicFilterConfig(mapOntologyFunctionQueryConfigToBasicFilter(detail.queryConfig));
  }
  const rawCode = typeof detail.code === "string" ? detail.code.trim() : "";
  if (!rawCode) {
    return "";
  }
  try {
    return `${JSON.stringify(JSON.parse(rawCode), null, 2)}\n`;
  } catch {
    return rawCode;
  }
}

/**
 * @description 解析详情版本号；空值时使用回退版本。
 * @param detailVersion 详情 data.version。
 * @param fallbackVersion 列表行或请求所用版本。
 * @returns 非空版本或空串。
 */
function resolveDetailVersion(detailVersion: unknown, fallbackVersion?: string): string {
  if (typeof detailVersion === "string" && detailVersion.trim()) {
    return detailVersion.trim();
  }
  return typeof fallbackVersion === "string" ? fallbackVersion.trim() : "";
}

/**
 * @description 按详情类型组装草稿 definition；脚本使用 data.code 原文与 language。
 * @param detail 详情接口 data。
 * @param type 页面函数类型。
 * @returns 草稿 definition。
 */
function mapDetailToDraftDefinition(detail: GetOntologyFunctionDetailData, type: FunctionOperatorDraft["type"]): FunctionOperatorDefinition {
  if (type === "basic") {
    const filtersDoc = detail.queryConfig ? mapOntologyFunctionQueryConfigToBasicFilter(detail.queryConfig) : createEmptyBasicFilterDocument();
    return {
      kind: "basic",
      parameterConfig: stringifyBasicFilterConfig(filtersDoc),
      aggFunc: resolveAggFunc(detail.queryConfig?.aggFunc),
      targetProperty: resolveTargetProperty(detail.queryConfig?.targetProperty),
    };
  }
  if (type === "code") {
    return {
      kind: "code",
      language: mapScriptLanguageFromApi(detail.language),
      code: typeof detail.code === "string" ? detail.code : "",
    };
  }
  return { kind: type };
}

/**
 * @description 将函数详情映射为编辑弹框草稿（基础 / 脚本表单字段）。
 * @param detail 详情接口 data。
 * @param fallbackSpaceId 详情缺省空间 id 时的回退值。
 * @param fallbackVersion 详情缺省 version 时的回退值（通常为列表行版本）。
 * @returns 可回填表单的草稿。
 */
export function mapOntologyFunctionDetailToDraft(
  detail: GetOntologyFunctionDetailData,
  fallbackSpaceId: number,
  fallbackVersion?: string,
): FunctionOperatorDraft {
  const spaceId = Number.isFinite(detail.ontologySpaceId) ? detail.ontologySpaceId : fallbackSpaceId;
  const functionApi = typeof detail.functionApi === "string" ? detail.functionApi.trim() : "";
  const apiModelType = typeof detail.type === "string" ? detail.type.trim() : "";
  const type = mapFunctionOperatorTypeFromApi(apiModelType);
  return {
    id: functionApi || undefined,
    spaceId,
    name: typeof detail.displayName === "string" ? detail.displayName.trim() : "",
    functionApi,
    type,
    apiModelType,
    protocol: type === "code" || type === "composite" ? "HTTP" : "",
    version: resolveDetailVersion(detail.version, fallbackVersion),
    description: typeof detail.description === "string" ? detail.description.trim() : "",
    createdBy: "",
    createdAt: "",
    status: "",
    category: "",
    inputParameters: mapDetailParamsByCategory(detail.params, "INPUT"),
    outputParameters: mapDetailParamsByCategory(detail.params, "OUTPUT"),
    timeout: 0,
    retryCount: 0,
    retryInterval: 0,
    definition: mapDetailToDraftDefinition(detail, type),
    dependencies: [],
    testStatus: "untested",
    testedAt: "",
  };
}

/**
 * @description 将函数详情映射为详情抽屉展示模型；契约无字段置空，可由列表行回填更新时间。
 * @param detail 详情接口 data。
 * @param listOperator 可选列表行，用于保留 updateTime 等列表已有字段。
 * @returns 抽屉用 FunctionOperator。
 */
export function mapOntologyFunctionDetailToOperator(detail: GetOntologyFunctionDetailData, listOperator?: FunctionOperator | null): FunctionOperator {
  const functionApi = typeof detail.functionApi === "string" ? detail.functionApi.trim() : listOperator?.functionApi.trim() || "";
  const apiModelType = typeof detail.type === "string" ? detail.type.trim() : listOperator?.apiModelType || "";
  const type = mapFunctionOperatorTypeFromApi(apiModelType || listOperator?.type);
  const spaceId = Number.isFinite(detail.ontologySpaceId) ? detail.ontologySpaceId : (listOperator?.spaceId ?? 0);
  const parameterConfig = resolveDetailParameterConfig(detail);
  let definition: FunctionOperatorDefinition;
  if (type === "basic") {
    definition = {
      kind: "basic",
      parameterConfig,
      aggFunc: resolveAggFunc(detail.queryConfig?.aggFunc),
      targetProperty: resolveTargetProperty(detail.queryConfig?.targetProperty),
    };
  } else if (type === "code") {
    definition = {
      kind: "code",
      language: mapScriptLanguageFromApi(detail.language),
      code: typeof detail.code === "string" ? detail.code : "",
    };
  } else {
    definition = { kind: type };
  }
  return {
    id: functionApi || listOperator?.id || "",
    spaceId,
    name: typeof detail.displayName === "string" ? detail.displayName.trim() : listOperator?.name || "",
    functionApi,
    description: typeof detail.description === "string" ? detail.description.trim() : listOperator?.description || "",
    type,
    apiModelType,
    protocol: type === "code" || type === "composite" ? "HTTP" : "",
    version: resolveDetailVersion(detail.version, listOperator?.version),
    createdBy: "",
    createdAt: listOperator?.createdAt?.trim() || "",
    updatedAt: listOperator?.updatedAt?.trim() || "",
    status: mapOntologyFunctionPublishStatus(detail.publishStatus) || listOperator?.status || "",
    category: "",
    inputParameters: mapDetailParamsByCategory(detail.params, "INPUT"),
    outputParameters: mapDetailParamsByCategory(detail.params, "OUTPUT"),
    timeout: 0,
    retryCount: 0,
    retryInterval: 0,
    definition,
    dependencies: [],
    testStatus: "untested",
    testedAt: "",
    versions: [],
  };
}
