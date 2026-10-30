import type { FunctionOperatorScriptLanguage } from "@/types";

import { parseGroovyScriptExportParams } from "./parseGroovyScriptExportParams.ts";
import { parseJavaLanguageScriptExportParams } from "./parseJavaLanguageScriptExportParams.ts";
import { parsePythonScriptExportParams } from "./parsePythonScriptExportParams.ts";
import { parseTypescriptScriptExportParams } from "./parseTypescriptScriptExportParams.ts";
import { createEmptyScriptExportParams, type ScriptExportParams } from "./scriptExportParamsType.ts";

export type { ScriptExportParams } from "./scriptExportParamsType.ts";

/**
 * @description 按脚本语言解析入口方法入出参标签；未知语言返回空。
 * @param language 脚本语言。
 * @param source 源码。
 * @returns 输入与输出标签（格式 `name - type`）。
 */
export function parseScriptExportParams(language: FunctionOperatorScriptLanguage, source: string): ScriptExportParams {
  if (language === "typescript") {
    return parseTypescriptScriptExportParams(source);
  }
  if (language === "python") {
    return parsePythonScriptExportParams(source);
  }
  if (language === "groovy") {
    return parseGroovyScriptExportParams(source);
  }
  if (language === "java") {
    return parseJavaLanguageScriptExportParams(source);
  }
  return createEmptyScriptExportParams();
}
