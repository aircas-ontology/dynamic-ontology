import { createEmptyScriptExportParams, type ScriptExportParams } from "./scriptExportParamsType.ts";

/**
 * @description 收集 Java class 的 public 字段：`public Type name;`。
 * @param source 源码。
 * @returns 类型名到标签列表。
 */
function collectJavaNamedTypes(source: string): Map<string, string[]> {
  const namedTypes = new Map<string, string[]>();
  const classPattern = /(?:public\s+)?class\s+([A-Za-z_]\w*)\s*\{/g;
  let classMatch = classPattern.exec(source);
  while (classMatch) {
    const typeName = classMatch[1] ?? "";
    const openIndex = (classMatch.index ?? 0) + classMatch[0].length - 1;
    const closeIndex = findMatchingBrace(source, openIndex);
    if (closeIndex < 0) {
      classMatch = classPattern.exec(source);
      continue;
    }
    const bodyText = source.slice(openIndex + 1, closeIndex);
    const labels = parseJavaClassFields(bodyText);
    if (typeName && labels.length) {
      namedTypes.set(typeName, labels);
    }
    classMatch = classPattern.exec(source);
  }
  return namedTypes;
}

/**
 * @description 查找与开括号匹配的闭括号（忽略字符串与字符字面量）。
 * @param source 源码。
 * @param openIndex `{` 下标。
 * @returns `}` 下标；未找到为 -1。
 */
function findMatchingBrace(source: string, openIndex: number): number {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index] ?? "";
    if (inSingle) {
      if (char === "\\") {
        index += 1;
        continue;
      }
      if (char === "'") {
        inSingle = false;
      }
      continue;
    }
    if (inDouble) {
      if (char === "\\") {
        index += 1;
        continue;
      }
      if (char === '"') {
        inDouble = false;
      }
      continue;
    }
    if (char === "'") {
      inSingle = true;
      continue;
    }
    if (char === '"') {
      inDouble = true;
      continue;
    }
    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

/**
 * @description 从 class 体解析 public 字段标签。
 * @param bodyText class 花括号内文本。
 * @returns `name - type` 列表。
 */
function parseJavaClassFields(bodyText: string): string[] {
  const labels: string[] = [];
  const fieldPattern = /^\s*public\s+(?:static\s+|final\s+)*([A-Za-z_]\w*(?:\s*<[^>]+>)?)\s+([A-Za-z_]\w*)\s*;/gm;
  let fieldMatch = fieldPattern.exec(bodyText);
  while (fieldMatch) {
    const typeText = (fieldMatch[1] ?? "").trim().replace(/\s+/g, "");
    const fieldName = (fieldMatch[2] ?? "").trim();
    if (typeText && fieldName) {
      labels.push(`${fieldName} - ${typeText}`);
    }
    fieldMatch = fieldPattern.exec(bodyText);
  }
  return labels;
}

/**
 * @description 查找首个 Java 业务方法：`public ReturnType name(InputType param)`。
 * @param source 源码。
 * @returns 返回类型与首参类型；未找到则为 null。
 */
function findFirstJavaMethod(source: string): { returnType: string; paramType: string } | null {
  const methodPattern = /public\s+(?:static\s+)?([A-Za-z_]\w*)\s+([A-Za-z_]\w*)\s*\(\s*([A-Za-z_]\w*)\s+[A-Za-z_]\w*\s*\)\s*\{/m;
  const match = source.match(methodPattern);
  if (!match) {
    return null;
  }
  const returnType = (match[1] ?? "").trim();
  const methodName = (match[2] ?? "").trim();
  const paramType = (match[3] ?? "").trim();
  if (!returnType || !methodName || !paramType || returnType === "class") {
    return null;
  }
  return { returnType, paramType };
}

/**
 * @description 解析 Java 脚本中首个 public 方法的输入/输出参数标签。
 * @param source Java 源码。
 * @returns 输入与输出标签（格式 `name - type`）。
 */
export function parseJavaLanguageScriptExportParams(source: string): ScriptExportParams {
  const empty = createEmptyScriptExportParams();
  if (!source.trim()) {
    return empty;
  }
  const entry = findFirstJavaMethod(source);
  if (!entry) {
    return empty;
  }
  const namedTypes = collectJavaNamedTypes(source);
  return {
    inputLabels: namedTypes.get(entry.paramType) ?? [],
    outputLabels: namedTypes.get(entry.returnType) ?? [],
  };
}
