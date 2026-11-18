import type { FunctionOperatorScriptLanguage } from "@/types";

/** 脚本函数 Web-IDE 各语言默认 starter。 */
export const SCRIPT_FUNCTION_STARTERS: Record<FunctionOperatorScriptLanguage, string> = {
  typescript: `interface User {
  id: number;
  name: string;
}

interface Output {
  id: number;
  name: string;
}

export function handle(input: User): Output {
    return {
        id:input.id+1,
        name:input.name+'a',
    }
}
`,
  groovy: `import com.aircas.ptr.foundry.ontology.model.vo.FunctionResultVO
// @result:integer
class GroovyTextToInteger {

    FunctionResultVO handle(String text) {
        def v = text == null ? "0" : text.toString().trim()
        int n = 0
        try {
            n = Integer.parseInt(v)
        } catch (Exception e) {
            n = 0
        }
        return FunctionResultVO.builder()
                .data(n)
                .description("解析结果：" + n)
                .build()
    }
}
`,
  python: `# @result:string
def handle(input_data: dict) -> dict:
    text = (input_data or {}).get("text")
    s = "" if text is None else str(text).strip()
    return {"data": s.upper(), "description": f"长度={len(s)}"}
`,
  java: `public class ExecuteInput {
  public String name;
  public double count;
  public boolean enabled;
}

public class ExecuteOutput {
  public String message;
  public double score;
  public boolean ok;
}

public class ScriptFunction {
  public ExecuteOutput handle(ExecuteInput input) {
    // 在这里实现业务逻辑
    ExecuteOutput output = new ExecuteOutput();
    output.message = input.name;
    output.score = input.count;
    output.ok = input.enabled;
    return output;
  }
}
`,
};

/** 新建脚本草稿默认语言。 */
export const DEFAULT_SCRIPT_FUNCTION_LANGUAGE: FunctionOperatorScriptLanguage = "typescript";

/**
 * @description 规范化脚本代码后再比较：统一换行并去掉尾部空白。
 * @param code 原始代码。
 * @returns 规范化后的文本。
 */
export function normalizeScriptFunctionCode(code: string): string {
  return code.replace(/\r\n/g, "\n").replace(/\s+$/u, "");
}

/**
 * @description 判断代码是否仍为指定语言的默认 starter（忽略 CRLF 与尾部空白）。
 * @param code 当前编辑器代码。
 * @param language 目标语言。
 * @returns 匹配默认 starter 时为 true。
 */
export function isScriptFunctionStarterCode(code: string, language: FunctionOperatorScriptLanguage): boolean {
  return normalizeScriptFunctionCode(code) === normalizeScriptFunctionCode(SCRIPT_FUNCTION_STARTERS[language]);
}

/**
 * @description 判断代码是否仍为任一语言的默认 starter。
 * @param code 当前编辑器代码。
 * @returns 匹配任一 starter 时为 true。
 */
export function isAnyScriptFunctionStarterCode(code: string): boolean {
  const normalized = normalizeScriptFunctionCode(code);
  if (!normalized) {
    return false;
  }
  return (Object.keys(SCRIPT_FUNCTION_STARTERS) as FunctionOperatorScriptLanguage[]).some(
    (language) => normalizeScriptFunctionCode(SCRIPT_FUNCTION_STARTERS[language]) === normalized,
  );
}

/**
 * @description 切换语言时是否应同步替换为新语言默认模板。
 * 产品策略：始终替换，避免语言与代码模板不一致；编辑态由 languageLocked 禁用切换。
 * @param _code 当前代码（保留参数便于调用方兼容）。
 * @param _previousLanguage 切换前语言（保留参数便于调用方兼容）。
 * @returns 始终为 true。
 */
export function shouldReplaceScriptStarterOnLanguageChange(_code: string, _previousLanguage: FunctionOperatorScriptLanguage): boolean {
  return true;
}

/**
 * @description 生成新建会话用的默认脚本代码草稿。
 * @returns TypeScript starter 文本。
 */
export function createDefaultScriptFunctionCode(): string {
  return SCRIPT_FUNCTION_STARTERS[DEFAULT_SCRIPT_FUNCTION_LANGUAGE];
}
