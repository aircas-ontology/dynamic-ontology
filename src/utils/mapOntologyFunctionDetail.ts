import type {
  FunctionOperator,
  FunctionOperatorAggFunc,
  FunctionOperatorDraft,
  FunctionOperatorParameter,
  FunctionOperatorParameterType,
  GetOntologyFunctionDetailData,
  GetOntologyFunctionDetailParamItem,
} from "@/types";
import { createEmptyBasicFilterDocument, mapOntologyFunctionQueryConfigToBasicFilter, stringifyBasicFilterConfig } from "./functionOperatorBasicFilter.ts";

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
 * @description 将详情 params 映射为抽屉输入参数列表。
 * @param params 详情 params。
 * @returns 页面输入参数。
 */
function mapDetailParamsToInputParameters(params: GetOntologyFunctionDetailParamItem[] | undefined): FunctionOperatorParameter[] {
  if (!Array.isArray(params) || !params.length) {
    return [];
  }
  return [...params]
    .sort((a, b) => (a.paramOrder ?? 0) - (b.paramOrder ?? 0))
    .map((item, index) => {
      const name = typeof item.paramName === "string" ? item.paramName.trim() : "";
      const description = typeof item.description === "string" ? item.description.trim() : "";
      const role = typeof item.paramRole === "string" ? item.paramRole.trim() : "";
      const descParts = [description, role ? `角色：${role}` : ""].filter(Boolean);
      return {
        id: String(item.paramId ?? `${name || "param"}-${index}`),
        name,
        type: mapDetailParamType(item.paramType),
        required: false,
        description: descParts.join("；"),
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
 * @description 将函数详情映射为编辑弹框草稿（基础函数表单字段）。
 * @param detail 详情接口 data。
 * @param fallbackSpaceId 详情缺省空间 id 时的回退值。
 * @returns 可回填表单的草稿。
 */
export function mapOntologyFunctionDetailToDraft(detail: GetOntologyFunctionDetailData, fallbackSpaceId: number): FunctionOperatorDraft {
  const filtersDoc = detail.queryConfig ? mapOntologyFunctionQueryConfigToBasicFilter(detail.queryConfig) : createEmptyBasicFilterDocument();
  const aggFunc = resolveAggFunc(detail.queryConfig?.aggFunc);
  const spaceId = Number.isFinite(detail.ontologySpaceId) ? detail.ontologySpaceId : fallbackSpaceId;
  const functionApi = typeof detail.functionApi === "string" ? detail.functionApi.trim() : "";
  return {
    id: functionApi || undefined,
    spaceId,
    name: typeof detail.displayName === "string" ? detail.displayName.trim() : "",
    functionApi,
    type: "basic",
    apiModelType: typeof detail.type === "string" ? detail.type.trim() : "",
    protocol: "",
    version: "",
    description: typeof detail.description === "string" ? detail.description.trim() : "",
    createdBy: "",
    status: "",
    category: "",
    inputParameters: [],
    outputParameters: [],
    timeout: 0,
    retryCount: 0,
    retryInterval: 0,
    definition: {
      kind: "basic",
      parameterConfig: stringifyBasicFilterConfig(filtersDoc),
      aggFunc,
    },
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
  const spaceId = Number.isFinite(detail.ontologySpaceId) ? detail.ontologySpaceId : (listOperator?.spaceId ?? 0);
  const parameterConfig = resolveDetailParameterConfig(detail);
  return {
    id: functionApi || listOperator?.id || "",
    spaceId,
    name: typeof detail.displayName === "string" ? detail.displayName.trim() : listOperator?.name || "",
    functionApi,
    description: typeof detail.description === "string" ? detail.description.trim() : listOperator?.description || "",
    type: "basic",
    apiModelType,
    protocol: "",
    version: "",
    createdBy: "",
    updatedAt: listOperator?.updatedAt?.trim() || "",
    status: "",
    category: "",
    inputParameters: mapDetailParamsToInputParameters(detail.params),
    outputParameters: [],
    timeout: 0,
    retryCount: 0,
    retryInterval: 0,
    definition: {
      kind: "basic",
      parameterConfig,
      aggFunc: resolveAggFunc(detail.queryConfig?.aggFunc),
    },
    dependencies: [],
    testStatus: "untested",
    testedAt: "",
    versions: [],
  };
}
