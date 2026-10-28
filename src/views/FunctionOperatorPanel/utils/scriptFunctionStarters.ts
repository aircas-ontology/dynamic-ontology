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
  groovy: `class ExecuteInput {
  String name
  Number count
  Boolean enabled
}

class ExecuteOutput {
  String message
  Number score
  Boolean ok
}

ExecuteOutput execute(ExecuteInput input) {
  // 在这里实现业务逻辑
  return new ExecuteOutput(
    message: input.name,
    score: input.count,
    ok: input.enabled
  )
}
`,
  python: `from typing import TypedDict


class ExecuteInput(TypedDict):
    name: str
    count: float
    enabled: bool


class ExecuteOutput(TypedDict):
    message: str
    score: float
    ok: bool


def execute(input: ExecuteInput) -> ExecuteOutput:
    # 在这里实现业务逻辑
    return {
        "message": input["name"],
        "score": input["count"],
        "ok": input["enabled"],
    }
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
  public ExecuteOutput execute(ExecuteInput input) {
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
 * @description 生成新建会话用的默认脚本代码草稿。
 * @returns TypeScript starter 文本。
 */
export function createDefaultScriptFunctionCode(): string {
  return SCRIPT_FUNCTION_STARTERS[DEFAULT_SCRIPT_FUNCTION_LANGUAGE];
}
