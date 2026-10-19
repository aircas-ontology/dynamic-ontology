import type { ParseOntologyFunctionParamItem } from "@/types";

/** 按输入、输出拆开后的解析参数树。 */
export interface SplitParsedScriptParameters {
  inputParameters: ParseOntologyFunctionParamItem[];
  outputParameters: ParseOntologyFunctionParamItem[];
}

/**
 * @description 按 paramOrder 递归排序参数树，空 fields 视为叶子。
 * @param parameters 同一层级的参数。
 * @returns 排序后的新树。
 */
function sortParsedScriptParameterTree(parameters: ParseOntologyFunctionParamItem[]): ParseOntologyFunctionParamItem[] {
  return [...parameters]
    .sort((left, right) => left.paramOrder - right.paramOrder)
    .map((item) => ({
      ...item,
      fields: item.fields && item.fields.length > 0 ? sortParsedScriptParameterTree(item.fields) : undefined,
    }));
}

/**
 * @description 将解析接口参数按顶层 INPUT / OUTPUT 拆成两棵树，并按 paramOrder 排序每一层。
 * @param parameters 解析接口返回的 parameters。
 * @returns 输入参数树与输出参数树。
 */
export function splitParsedScriptParameters(parameters: ParseOntologyFunctionParamItem[]): SplitParsedScriptParameters {
  const inputParameters: ParseOntologyFunctionParamItem[] = [];
  const outputParameters: ParseOntologyFunctionParamItem[] = [];
  for (const item of parameters) {
    if (item.category === "INPUT") {
      inputParameters.push(item);
    } else if (item.category === "OUTPUT") {
      outputParameters.push(item);
    }
  }
  return {
    inputParameters: sortParsedScriptParameterTree(inputParameters),
    outputParameters: sortParsedScriptParameterTree(outputParameters),
  };
}
