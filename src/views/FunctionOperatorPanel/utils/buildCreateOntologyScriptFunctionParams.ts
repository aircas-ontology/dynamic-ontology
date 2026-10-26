import type { CreateOntologyFunctionParameter, CreateOntologyFunctionParams, FunctionOperatorScriptLanguage, ParseOntologyFunctionParamItem } from "@/types";
import { mapScriptLanguageToApi } from "../../../utils/mapFunctionOperatorScriptLanguage.ts";

/** 组装脚本函数创建请求的输入。 */
export interface BuildCreateOntologyScriptFunctionParamsInput {
  functionApi: string;
  version: string;
  displayName: string;
  description: string;
  ontologySpaceId: number;
  language: FunctionOperatorScriptLanguage;
  code: string;
  /** 已解析的输入、输出参数树。 */
  parameters: ParseOntologyFunctionParamItem[];
  /** 新建表单所选源版本；非空表示基于旧版本创建。 */
  sourceVersion: string;
  /** 限流配置模板 ID；有值才写入请求体。 */
  rateLimitTemplateId?: number;
}

export { mapScriptLanguageFromApi, mapScriptLanguageToApi } from "../../../utils/mapFunctionOperatorScriptLanguage.ts";

/**
 * @description 将解析参数树转为创建接口 parameters，并按 paramOrder 排序每一层。
 * @param parameters 解析得到的参数。
 * @returns 可提交的参数树。
 */
function mapParsedParameters(parameters: ParseOntologyFunctionParamItem[]): CreateOntologyFunctionParameter[] {
  const mapped: CreateOntologyFunctionParameter[] = [];
  const ordered = [...parameters].sort((left, right) => left.paramOrder - right.paramOrder);
  for (const item of ordered) {
    if (item.category !== "INPUT" && item.category !== "OUTPUT") {
      continue;
    }
    const parameter: CreateOntologyFunctionParameter = {
      paramName: item.paramName,
      paramType: item.paramType,
      category: item.category,
      paramOrder: item.paramOrder,
      referenceType: item.referenceType,
    };
    if (item.fields && item.fields.length > 0) {
      parameter.fields = mapParsedParameters(item.fields);
    }
    mapped.push(parameter);
  }
  return mapped;
}

/**
 * @description 组装 CUSTOMIZE 脚本函数创建请求体；不含 queryConfig。
 * @param input 通用配置、代码与已解析参数。
 * @returns 创建接口请求参数。
 */
export function buildCreateOntologyScriptFunctionParams(input: BuildCreateOntologyScriptFunctionParamsInput): CreateOntologyFunctionParams {
  const params: CreateOntologyFunctionParams = {
    functionApi: input.functionApi.trim(),
    version: input.version.trim(),
    displayName: input.displayName.trim(),
    description: input.description.trim(),
    type: "CUSTOMIZE",
    language: mapScriptLanguageToApi(input.language),
    ontologySpaceId: input.ontologySpaceId,
    code: input.code,
    parameters: mapParsedParameters(input.parameters),
    basedOnOldVersion: Boolean(input.sourceVersion.trim()),
  };
  if (typeof input.rateLimitTemplateId === "number" && Number.isFinite(input.rateLimitTemplateId)) {
    params.rateLimitTemplateId = input.rateLimitTemplateId;
  }
  return params;
}
