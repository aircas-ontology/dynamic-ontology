import type {
  CreateOntologyFunctionParameter,
  CreateOntologyFunctionParameterType,
  CreateOntologyFunctionParams,
  FunctionOperatorScriptLanguage,
} from "@/types";
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
  inputLabels: string[];
  outputLabels: string[];
  /** 新建表单所选源版本；非空表示基于旧版本创建。 */
  sourceVersion: string;
}

export { mapScriptLanguageFromApi, mapScriptLanguageToApi } from "../../../utils/mapFunctionOperatorScriptLanguage.ts";

/**
 * @description 将展示用类型文本映射为创建接口 paramType。
 * @param typeText 标签中的类型片段（如 string / number）。
 * @returns 契约 paramType。
 */
function mapScriptTypeTextToParamType(typeText: string): CreateOntologyFunctionParameterType {
  const normalized = typeText.trim().toLowerCase();
  if (normalized === "string") {
    return "STRING";
  }
  if (normalized === "number") {
    return "NUMBER";
  }
  if (normalized === "boolean") {
    return "BOOLEAN";
  }
  return "OBJECT";
}

/**
 * @description 将 `name - type` 标签列表转为创建接口 parameters 片段。
 * @param labels 展示标签。
 * @param category INPUT 或 OUTPUT。
 * @returns 参数项列表。
 */
function mapScriptLabelsToParameters(labels: string[], category: CreateOntologyFunctionParameter["category"]): CreateOntologyFunctionParameter[] {
  const parameters: CreateOntologyFunctionParameter[] = [];
  for (const label of labels) {
    const separatorIndex = label.indexOf(" - ");
    if (separatorIndex <= 0) {
      continue;
    }
    const paramName = label.slice(0, separatorIndex).trim();
    const typeText = label.slice(separatorIndex + 3).trim();
    if (!paramName) {
      continue;
    }
    parameters.push({
      paramName,
      paramType: mapScriptTypeTextToParamType(typeText),
      category,
    });
  }
  return parameters;
}

/**
 * @description 组装 CUSTOMIZE 脚本函数创建请求体；不含 queryConfig。
 * @param input 通用配置、代码与识别出的入出参标签。
 * @returns 创建接口请求参数。
 */
export function buildCreateOntologyScriptFunctionParams(input: BuildCreateOntologyScriptFunctionParamsInput): CreateOntologyFunctionParams {
  const parameters = [...mapScriptLabelsToParameters(input.inputLabels, "INPUT"), ...mapScriptLabelsToParameters(input.outputLabels, "OUTPUT")];
  return {
    functionApi: input.functionApi.trim(),
    version: input.version.trim(),
    displayName: input.displayName.trim(),
    description: input.description.trim(),
    type: "CUSTOMIZE",
    language: mapScriptLanguageToApi(input.language),
    ontologySpaceId: input.ontologySpaceId,
    code: input.code,
    parameters,
    basedOnOldVersion: Boolean(input.sourceVersion.trim()),
  };
}
