/** 脚本函数入口方法入参/出参标签解析结果。 */
export interface ScriptExportParams {
  inputLabels: string[];
  outputLabels: string[];
}

/**
 * @description 生成空的入出参标签结果。
 * @returns 空标签集合。
 */
export function createEmptyScriptExportParams(): ScriptExportParams {
  return { inputLabels: [], outputLabels: [] };
}
