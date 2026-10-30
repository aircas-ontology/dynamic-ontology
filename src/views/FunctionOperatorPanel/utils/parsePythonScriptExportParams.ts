import { createEmptyScriptExportParams, type ScriptExportParams } from "./scriptExportParamsType.ts";

/**
 * @description 收集 Python TypedDict / 类注解字段：`name: type`。
 * @param source 源码。
 * @returns 类型名到标签列表。
 */
function collectPythonNamedTypes(source: string): Map<string, string[]> {
  const namedTypes = new Map<string, string[]>();
  const classPattern = /class\s+([A-Za-z_]\w*)\s*(?:\([^)]*\))?\s*:/g;
  let classMatch = classPattern.exec(source);
  while (classMatch) {
    const typeName = classMatch[1] ?? "";
    const bodyStart = (classMatch.index ?? 0) + classMatch[0].length;
    const bodyText = extractPythonIndentedBlock(source, bodyStart);
    const labels = parsePythonAnnotatedFields(bodyText);
    if (typeName && labels.length) {
      namedTypes.set(typeName, labels);
    }
    classMatch = classPattern.exec(source);
  }
  return namedTypes;
}

/**
 * @description 截取 class/def 后缩进块文本（到同级或更少缩进行为止）。
 * @param source 源码。
 * @param bodyStart 块起始下标。
 * @returns 缩进块文本。
 */
function extractPythonIndentedBlock(source: string, bodyStart: number): string {
  const lines = source.slice(bodyStart).split("\n");
  if (!lines.length) {
    return "";
  }
  let baseIndent: number | null = null;
  const collected: string[] = [];
  for (const line of lines) {
    if (!line.trim()) {
      if (baseIndent !== null) {
        collected.push(line);
      }
      continue;
    }
    const indent = line.match(/^\s*/)?.[0]?.length ?? 0;
    if (baseIndent === null) {
      baseIndent = indent;
      collected.push(line);
      continue;
    }
    if (indent < baseIndent) {
      break;
    }
    collected.push(line);
  }
  return collected.join("\n");
}

/**
 * @description 从类体解析注解字段标签。
 * @param bodyText 类体文本。
 * @returns `name - type` 列表。
 */
function parsePythonAnnotatedFields(bodyText: string): string[] {
  const labels: string[] = [];
  const fieldPattern = /^\s*([A-Za-z_]\w*)\s*:\s*(.+?)\s*(?:#.*)?$/gm;
  let fieldMatch = fieldPattern.exec(bodyText);
  while (fieldMatch) {
    const fieldName = (fieldMatch[1] ?? "").trim();
    const typeText = (fieldMatch[2] ?? "").trim();
    if (fieldName && typeText && fieldName !== "pass") {
      labels.push(`${fieldName} - ${typeText}`);
    }
    fieldMatch = fieldPattern.exec(bodyText);
  }
  return labels;
}

/**
 * @description 查找首个顶层 def 的参数与返回注解。
 * @param source 源码。
 * @returns 首参类型与返回类型；未找到则为 null。
 */
function findFirstPythonFunction(source: string): { paramType: string; returnType: string } | null {
  const defPattern = /^def\s+[A-Za-z_]\w*\s*\(([\s\S]*?)\)\s*(?:->\s*([^:]+))?\s*:/m;
  const match = source.match(defPattern);
  if (!match) {
    return null;
  }
  const paramsText = (match[1] ?? "").trim();
  const returnType = (match[2] ?? "").trim();
  const paramType = extractPythonFirstParamType(paramsText);
  return { paramType, returnType };
}

/**
 * @description 从 def 参数列表提取首个参数的类型注解。
 * @param paramsText 括号内参数文本。
 * @returns 类型文本。
 */
function extractPythonFirstParamType(paramsText: string): string {
  if (!paramsText.trim()) {
    return "";
  }
  const parts = splitPythonParams(paramsText);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed === "self" || trimmed === "cls" || trimmed.startsWith("*")) {
      continue;
    }
    const annotated = trimmed.match(/^[A-Za-z_]\w*\s*:\s*(.+?)(?:\s*=.*)?$/);
    if (annotated?.[1]) {
      return annotated[1].trim();
    }
  }
  return "";
}

/**
 * @description 按顶层逗号拆分 Python 参数列表。
 * @param paramsText 参数文本。
 * @returns 参数片段。
 */
function splitPythonParams(paramsText: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  for (let index = 0; index < paramsText.length; index += 1) {
    const char = paramsText[index] ?? "";
    if (char === "(") {
      depthParen += 1;
    } else if (char === ")") {
      depthParen = Math.max(0, depthParen - 1);
    } else if (char === "[") {
      depthBracket += 1;
    } else if (char === "]") {
      depthBracket = Math.max(0, depthBracket - 1);
    } else if (char === "{") {
      depthBrace += 1;
    } else if (char === "}") {
      depthBrace = Math.max(0, depthBrace - 1);
    } else if (char === "," && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) {
    parts.push(current);
  }
  return parts;
}

/**
 * @description 解析 Python 脚本中首个顶层 def 的输入/输出参数标签。
 * @param source Python 源码。
 * @returns 输入与输出标签（格式 `name - type`）。
 */
export function parsePythonScriptExportParams(source: string): ScriptExportParams {
  const empty = createEmptyScriptExportParams();
  if (!source.trim()) {
    return empty;
  }
  const entry = findFirstPythonFunction(source);
  if (!entry) {
    return empty;
  }
  const namedTypes = collectPythonNamedTypes(source);
  return {
    inputLabels: namedTypes.get(entry.paramType) ?? [],
    outputLabels: namedTypes.get(entry.returnType) ?? [],
  };
}
