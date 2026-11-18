import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  SCRIPT_FUNCTION_STARTERS,
  isScriptFunctionStarterCode,
  shouldReplaceScriptStarterOnLanguageChange,
} from "../src/views/FunctionOperatorPanel/utils/scriptFunctionStarters.ts";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * @description 读取源码文本。
 * @param {string} relativePath 相对 tests 的路径。
 * @returns {string} 文件内容。
 */
function readSource(relativePath) {
  return readFileSync(join(here, relativePath), "utf8");
}

test("script starter compare ignores CRLF and trailing whitespace", () => {
  const ts = SCRIPT_FUNCTION_STARTERS.typescript;
  const crlf = ts.replace(/\n/g, "\r\n");
  assert.equal(isScriptFunctionStarterCode(crlf, "typescript"), true);
  assert.equal(isScriptFunctionStarterCode(`${ts}\n\n`, "typescript"), true);
  assert.equal(isScriptFunctionStarterCode(ts, "groovy"), false);
  assert.equal(isScriptFunctionStarterCode("export function handle() {}", "typescript"), false);
});

test("language change always replaces code with target language starter", () => {
  const draft = SCRIPT_FUNCTION_STARTERS.typescript.replace(/\n/g, "\r\n");
  assert.equal(shouldReplaceScriptStarterOnLanguageChange(draft, "typescript"), true);
  assert.equal(shouldReplaceScriptStarterOnLanguageChange("", "typescript"), true);
  assert.equal(shouldReplaceScriptStarterOnLanguageChange("// user edited from template\n", "typescript"), true);
  assert.equal(shouldReplaceScriptStarterOnLanguageChange(SCRIPT_FUNCTION_STARTERS.java, "python"), true);
});

test("script ide language change always writes target starter", () => {
  const scriptIdeSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue");
  assert.match(scriptIdeSource, /emit\(["']update:code["'],\s*SCRIPT_FUNCTION_STARTERS\[language\]\)/);
  assert.doesNotMatch(scriptIdeSource, /props\.code === previousStarter/);
  assert.doesNotMatch(scriptIdeSource, /if\s*\(\s*shouldReplaceScriptStarterOnLanguageChange/);
  assert.match(scriptIdeSource, /lastStarterLanguage\.value\s*=\s*props\.language/);
});
