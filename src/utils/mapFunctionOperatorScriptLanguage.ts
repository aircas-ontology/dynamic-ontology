import type { FunctionOperatorScriptLanguage } from "@/types";

/** 页面脚本语言到接口 language 的映射。 */
const SCRIPT_LANGUAGE_TO_API: Record<FunctionOperatorScriptLanguage, string> = {
  typescript: "TYPESCRIPT",
  groovy: "GROOVY",
  python: "PYTHON",
  java: "JAVA",
};

/**
 * @description 将页面脚本语言映射为创建接口 language。
 * @param language 页面脚本语言。
 * @returns 接口 language 大写值。
 */
export function mapScriptLanguageToApi(language: FunctionOperatorScriptLanguage): string {
  return SCRIPT_LANGUAGE_TO_API[language];
}

/**
 * @description 将详情/接口 language 映射为页面脚本语言；未知或空值回落 typescript。
 * @param language 接口 language（如 TYPESCRIPT）。
 * @returns 页面脚本语言。
 */
export function mapScriptLanguageFromApi(language: unknown): FunctionOperatorScriptLanguage {
  const normalized = typeof language === "string" ? language.trim().toUpperCase() : "";
  if (normalized === "TYPESCRIPT") {
    return "typescript";
  }
  if (normalized === "GROOVY") {
    return "groovy";
  }
  if (normalized === "PYTHON") {
    return "python";
  }
  if (normalized === "JAVA") {
    return "java";
  }
  return "typescript";
}
