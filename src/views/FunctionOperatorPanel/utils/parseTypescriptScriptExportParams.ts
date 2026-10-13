/** 脚本函数 TypeScript export 方法入参/出参标签解析结果。 */
export interface TypescriptScriptExportParams {
  inputLabels: string[];
  outputLabels: string[];
}

/**
 * @description 跳过字符串与注释，返回从 start 起匹配的括号闭合位置（不含配对外的内容）。
 * @param source 源码。
 * @param openIndex 开括号下标。
 * @param openChar 开括号字符。
 * @param closeChar 闭括号字符。
 * @returns 闭括号下标；未找到则 -1。
 */
function findMatchingBracket(source: string, openIndex: number, openChar: string, closeChar: string): number {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }
    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }
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
    if (inTemplate) {
      if (char === "\\") {
        index += 1;
        continue;
      }
      if (char === "`") {
        inTemplate = false;
      }
      continue;
    }
    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
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
    if (char === "`") {
      inTemplate = true;
      continue;
    }
    if (char === openChar) {
      depth += 1;
      continue;
    }
    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

/**
 * @description 从对象类型体文本中解析 `name - type` 标签列表。
 * @param bodyText interface/type/inline 花括号内文本。
 * @returns 标签列表。
 */
function parseObjectTypeFields(bodyText: string): string[] {
  const labels: string[] = [];
  let index = 0;
  while (index < bodyText.length) {
    while (index < bodyText.length && /[\s,;]/.test(bodyText[index] ?? "")) {
      index += 1;
    }
    if (index >= bodyText.length) {
      break;
    }
    const nameMatch = bodyText.slice(index).match(/^([A-Za-z_$][\w$]*)\s*\??\s*:/);
    if (!nameMatch) {
      index += 1;
      continue;
    }
    const fieldName = nameMatch[1] ?? "";
    index += nameMatch[0].length;
    while (index < bodyText.length && /\s/.test(bodyText[index] ?? "")) {
      index += 1;
    }
    const typeStart = index;
    let depthAngle = 0;
    let depthBrace = 0;
    let depthParen = 0;
    let inSingle = false;
    let inDouble = false;
    while (index < bodyText.length) {
      const char = bodyText[index] ?? "";
      if (inSingle) {
        if (char === "\\") {
          index += 2;
          continue;
        }
        if (char === "'") {
          inSingle = false;
        }
        index += 1;
        continue;
      }
      if (inDouble) {
        if (char === "\\") {
          index += 2;
          continue;
        }
        if (char === '"') {
          inDouble = false;
        }
        index += 1;
        continue;
      }
      if (char === "'") {
        inSingle = true;
        index += 1;
        continue;
      }
      if (char === '"') {
        inDouble = true;
        index += 1;
        continue;
      }
      if (char === "<") {
        depthAngle += 1;
      } else if (char === ">") {
        depthAngle = Math.max(0, depthAngle - 1);
      } else if (char === "{") {
        depthBrace += 1;
      } else if (char === "}") {
        if (depthBrace === 0 && depthAngle === 0 && depthParen === 0) {
          break;
        }
        depthBrace = Math.max(0, depthBrace - 1);
      } else if (char === "(") {
        depthParen += 1;
      } else if (char === ")") {
        depthParen = Math.max(0, depthParen - 1);
      } else if ((char === ";" || char === "," || char === "\n") && depthAngle === 0 && depthBrace === 0 && depthParen === 0) {
        break;
      }
      index += 1;
    }
    const typeText = bodyText.slice(typeStart, index).trim().replace(/;$/, "");
    if (fieldName && typeText) {
      labels.push(`${fieldName} - ${typeText}`);
    }
    if (bodyText[index] === ";" || bodyText[index] === ",") {
      index += 1;
    }
  }
  return labels;
}

/**
 * @description 收集源码中 interface / type 对象别名定义。
 * @param source 源码。
 * @returns 类型名到字段标签的映射。
 */
function collectNamedObjectTypes(source: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const interfacePattern = /\binterface\s+([A-Za-z_$][\w$]*)\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = interfacePattern.exec(source)) !== null) {
    const name = match[1] ?? "";
    const openIndex = match.index + match[0].length - 1;
    const closeIndex = findMatchingBracket(source, openIndex, "{", "}");
    if (closeIndex < 0 || !name) {
      continue;
    }
    map.set(name, parseObjectTypeFields(source.slice(openIndex + 1, closeIndex)));
  }
  const typePattern = /\btype\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g;
  while ((match = typePattern.exec(source)) !== null) {
    const name = match[1] ?? "";
    const openIndex = match.index + match[0].length - 1;
    const closeIndex = findMatchingBracket(source, openIndex, "{", "}");
    if (closeIndex < 0 || !name) {
      continue;
    }
    map.set(name, parseObjectTypeFields(source.slice(openIndex + 1, closeIndex)));
  }
  return map;
}

/**
 * @description 将类型注解解析为字段标签；any/unknown/空/非对象返回空数组。
 * @param typeText 类型文本。
 * @param namedTypes 命名对象类型映射。
 * @returns 标签列表。
 */
function resolveTypeLabels(typeText: string, namedTypes: Map<string, string[]>): string[] {
  const trimmed = typeText.trim();
  if (!trimmed || trimmed === "any" || trimmed === "unknown" || trimmed === "void") {
    return [];
  }
  const promiseMatch = trimmed.match(/^Promise\s*<\s*([\s\S]+)\s*>$/);
  if (promiseMatch?.[1]) {
    return resolveTypeLabels(promiseMatch[1], namedTypes);
  }
  if (trimmed.startsWith("{")) {
    const closeIndex = findMatchingBracket(trimmed, 0, "{", "}");
    if (closeIndex > 0) {
      return parseObjectTypeFields(trimmed.slice(1, closeIndex));
    }
  }
  const simpleName = trimmed.match(/^([A-Za-z_$][\w$]*)$/);
  if (simpleName?.[1] && namedTypes.has(simpleName[1])) {
    return namedTypes.get(simpleName[1]) ?? [];
  }
  return [];
}

/**
 * @description 从函数体推断第一个 return 对象字面量的输出标签。
 * @param bodyText 函数体（含花括号）。
 * @returns 标签列表。
 */
function inferOutputLabelsFromReturnLiteral(bodyText: string): string[] {
  const returnMatch = bodyText.match(/\breturn\s*\{/);
  if (!returnMatch || returnMatch.index === undefined) {
    return [];
  }
  const openIndex = returnMatch.index + returnMatch[0].length - 1;
  const closeIndex = findMatchingBracket(bodyText, openIndex, "{", "}");
  if (closeIndex < 0) {
    return [];
  }
  const objectBody = bodyText.slice(openIndex + 1, closeIndex);
  const labels: string[] = [];
  let index = 0;
  while (index < objectBody.length) {
    while (index < objectBody.length && /[\s,]/.test(objectBody[index] ?? "")) {
      index += 1;
    }
    if (index >= objectBody.length) {
      break;
    }
    const keyMatch = objectBody.slice(index).match(/^([A-Za-z_$][\w$]*)\s*:/);
    if (!keyMatch) {
      index += 1;
      continue;
    }
    const key = keyMatch[1] ?? "";
    index += keyMatch[0].length;
    while (index < objectBody.length && /\s/.test(objectBody[index] ?? "")) {
      index += 1;
    }
    const valueStart = index;
    let depthBrace = 0;
    let depthParen = 0;
    let depthBracket = 0;
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    while (index < objectBody.length) {
      const char = objectBody[index] ?? "";
      if (inSingle) {
        if (char === "\\") {
          index += 2;
          continue;
        }
        if (char === "'") {
          inSingle = false;
        }
        index += 1;
        continue;
      }
      if (inDouble) {
        if (char === "\\") {
          index += 2;
          continue;
        }
        if (char === '"') {
          inDouble = false;
        }
        index += 1;
        continue;
      }
      if (inTemplate) {
        if (char === "\\") {
          index += 2;
          continue;
        }
        if (char === "`") {
          inTemplate = false;
        }
        index += 1;
        continue;
      }
      if (char === "'") {
        inSingle = true;
        index += 1;
        continue;
      }
      if (char === '"') {
        inDouble = true;
        index += 1;
        continue;
      }
      if (char === "`") {
        inTemplate = true;
        index += 1;
        continue;
      }
      if (char === "{") {
        depthBrace += 1;
      } else if (char === "}") {
        if (depthBrace === 0 && depthParen === 0 && depthBracket === 0) {
          break;
        }
        depthBrace = Math.max(0, depthBrace - 1);
      } else if (char === "(") {
        depthParen += 1;
      } else if (char === ")") {
        depthParen = Math.max(0, depthParen - 1);
      } else if (char === "[") {
        depthBracket += 1;
      } else if (char === "]") {
        depthBracket = Math.max(0, depthBracket - 1);
      } else if (char === "," && depthBrace === 0 && depthParen === 0 && depthBracket === 0) {
        break;
      }
      index += 1;
    }
    const valueText = objectBody.slice(valueStart, index).trim();
    labels.push(`${key} - ${inferLiteralTypeLabel(valueText)}`);
    if (objectBody[index] === ",") {
      index += 1;
    }
  }
  return labels;
}

/**
 * @description 根据 return 值表达式推断简单类型标签。
 * @param valueText 表达式文本。
 * @returns string / number / boolean / object。
 */
function inferLiteralTypeLabel(valueText: string): string {
  const trimmed = valueText.trim();
  if (!trimmed) {
    return "object";
  }
  if (/^(['"`]).*\1$/.test(trimmed) || /['"`]\s*\+/.test(trimmed) || /^\s*String\s*\(/.test(trimmed) || /['"`]/.test(trimmed)) {
    return "string";
  }
  if (/^(true|false)\b/.test(trimmed)) {
    return "boolean";
  }
  if (/^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(trimmed)) {
    return "number";
  }
  return "object";
}

/**
 * @description 定位第一个 export function / export async function 的参数列表与函数体。
 * @param source 源码。
 * @returns 参数文本、返回类型文本、函数体；未找到则 null。
 */
function findFirstExportedFunction(source: string): { paramsText: string; returnTypeText: string; bodyText: string } | null {
  const exportMatch = source.match(/\bexport\s+(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(/);
  if (!exportMatch || exportMatch.index === undefined) {
    return null;
  }
  const paramsOpen = exportMatch.index + exportMatch[0].length - 1;
  const paramsClose = findMatchingBracket(source, paramsOpen, "(", ")");
  if (paramsClose < 0) {
    return null;
  }
  let cursor = paramsClose + 1;
  while (cursor < source.length && /\s/.test(source[cursor] ?? "")) {
    cursor += 1;
  }
  let returnTypeText = "";
  if (source[cursor] === ":") {
    cursor += 1;
    while (cursor < source.length && /\s/.test(source[cursor] ?? "")) {
      cursor += 1;
    }
    const typeStart = cursor;
    let depthAngle = 0;
    let depthParen = 0;
    let depthBracket = 0;
    while (cursor < source.length) {
      const char = source[cursor] ?? "";
      if (char === "<") {
        depthAngle += 1;
        cursor += 1;
        continue;
      }
      if (char === ">") {
        depthAngle = Math.max(0, depthAngle - 1);
        cursor += 1;
        continue;
      }
      if (char === "(") {
        depthParen += 1;
        cursor += 1;
        continue;
      }
      if (char === ")") {
        depthParen = Math.max(0, depthParen - 1);
        cursor += 1;
        continue;
      }
      if (char === "[") {
        depthBracket += 1;
        cursor += 1;
        continue;
      }
      if (char === "]") {
        depthBracket = Math.max(0, depthBracket - 1);
        cursor += 1;
        continue;
      }
      if (char === "{" && depthAngle === 0 && depthParen === 0 && depthBracket === 0) {
        const closeIndex = findMatchingBracket(source, cursor, "{", "}");
        if (closeIndex < 0) {
          return null;
        }
        let peek = closeIndex + 1;
        while (peek < source.length && /\s/.test(source[peek] ?? "")) {
          peek += 1;
        }
        if (source[peek] === "{") {
          cursor = closeIndex + 1;
          continue;
        }
        returnTypeText = source.slice(typeStart, cursor).trim();
        break;
      }
      cursor += 1;
    }
    if (!returnTypeText && cursor > typeStart) {
      returnTypeText = source.slice(typeStart, cursor).trim();
    }
  }
  while (cursor < source.length && /\s/.test(source[cursor] ?? "")) {
    cursor += 1;
  }
  if (source[cursor] !== "{") {
    return null;
  }
  const bodyClose = findMatchingBracket(source, cursor, "{", "}");
  if (bodyClose < 0) {
    return null;
  }
  return {
    paramsText: source.slice(paramsOpen + 1, paramsClose),
    returnTypeText,
    bodyText: source.slice(cursor, bodyClose + 1),
  };
}

/**
 * @description 从参数列表文本提取第一个参数的类型注解。
 * @param paramsText 括号内参数文本。
 * @returns 类型文本；无则空串。
 */
function extractFirstParamType(paramsText: string): string {
  const trimmed = paramsText.trim();
  if (!trimmed) {
    return "";
  }
  const colonIndex = trimmed.indexOf(":");
  if (colonIndex < 0) {
    return "";
  }
  let index = colonIndex + 1;
  while (index < trimmed.length && /\s/.test(trimmed[index] ?? "")) {
    index += 1;
  }
  const typeStart = index;
  let depthAngle = 0;
  let depthBrace = 0;
  let depthParen = 0;
  while (index < trimmed.length) {
    const char = trimmed[index] ?? "";
    if (char === "<") {
      depthAngle += 1;
    } else if (char === ">") {
      depthAngle = Math.max(0, depthAngle - 1);
    } else if (char === "{") {
      depthBrace += 1;
    } else if (char === "}") {
      depthBrace = Math.max(0, depthBrace - 1);
    } else if (char === "(") {
      depthParen += 1;
    } else if (char === ")") {
      depthParen = Math.max(0, depthParen - 1);
    } else if (char === "," && depthAngle === 0 && depthBrace === 0 && depthParen === 0) {
      break;
    } else if (char === "=" && depthAngle === 0 && depthBrace === 0 && depthParen === 0) {
      break;
    }
    index += 1;
  }
  return trimmed.slice(typeStart, index).trim();
}

/**
 * @description 解析 TypeScript 脚本中第一个 export 方法的输入/输出参数标签，供 Web-IDE 左侧实时展示。
 * @param source TypeScript 源码。
 * @returns 输入与输出标签（格式 `name - type`）；无 export 方法时均为空。
 */
export function parseTypescriptScriptExportParams(source: string): TypescriptScriptExportParams {
  const empty: TypescriptScriptExportParams = { inputLabels: [], outputLabels: [] };
  if (!source.trim()) {
    return empty;
  }
  const exported = findFirstExportedFunction(source);
  if (!exported) {
    return empty;
  }
  const namedTypes = collectNamedObjectTypes(source);
  const inputType = extractFirstParamType(exported.paramsText);
  const inputLabels = resolveTypeLabels(inputType, namedTypes);
  let outputLabels = resolveTypeLabels(exported.returnTypeText, namedTypes);
  if (outputLabels.length === 0) {
    outputLabels = inferOutputLabelsFromReturnLiteral(exported.bodyText);
  }
  return { inputLabels, outputLabels };
}
