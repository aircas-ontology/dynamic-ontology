import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * @description 读取仓库内源文件文本。
 * @param relativePath 相对本测试文件的路径。
 * @returns 文件内容。
 */
function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

test("ensureMonacoEnvironment routes typescript to ts.worker", () => {
  const source = readSource("../src/utils/ensureMonacoEnvironment.ts");
  assert.match(source, /export function ensureMonacoEnvironment/);
  assert.match(source, /label === "typescript" \|\| label === "javascript"/);
  assert.match(source, /language\/typescript\/ts\.worker\.js/);
  assert.match(source, /editor\/editor\.worker\.js/);
});

test("script and schedule editors use shared ensureMonacoEnvironment", () => {
  const scriptEditor = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptCodeEditor.vue");
  const scheduleEditor = readSource("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowCodeEditor.vue");
  assert.match(scriptEditor, /from "@\/utils\/ensureMonacoEnvironment"/);
  assert.match(scheduleEditor, /from "@\/utils\/ensureMonacoEnvironment"/);
  assert.doesNotMatch(scriptEditor, /function ensureMonacoEnvironment/);
  assert.doesNotMatch(scheduleEditor, /function ensureMonacoEnvironment/);
  assert.doesNotMatch(scriptEditor, /仅使用明文编辑器 worker/);
});
