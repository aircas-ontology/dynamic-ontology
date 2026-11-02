import assert from "node:assert/strict";
import test from "node:test";

import { parseGroovyScriptExportParams } from "../src/views/FunctionOperatorPanel/utils/parseGroovyScriptExportParams.ts";
import { parseJavaLanguageScriptExportParams } from "../src/views/FunctionOperatorPanel/utils/parseJavaLanguageScriptExportParams.ts";
import { parsePythonScriptExportParams } from "../src/views/FunctionOperatorPanel/utils/parsePythonScriptExportParams.ts";
import { parseScriptExportParams } from "../src/views/FunctionOperatorPanel/utils/parseScriptExportParams.ts";
import { SCRIPT_FUNCTION_STARTERS } from "../src/views/FunctionOperatorPanel/utils/scriptFunctionStarters.ts";

test("parsePythonScriptExportParams reads TypedDict fields from starter", () => {
  const result = parsePythonScriptExportParams(SCRIPT_FUNCTION_STARTERS.python);
  assert.deepEqual(result.inputLabels, ["name - str", "count - float", "enabled - bool"]);
  assert.deepEqual(result.outputLabels, ["message - str", "score - float", "ok - bool"]);
});

test("parseGroovyScriptExportParams reads class fields from starter", () => {
  const result = parseGroovyScriptExportParams(SCRIPT_FUNCTION_STARTERS.groovy);
  assert.deepEqual(result.inputLabels, ["name - String", "count - Number", "enabled - Boolean"]);
  assert.deepEqual(result.outputLabels, ["message - String", "score - Number", "ok - Boolean"]);
});

test("parseJavaLanguageScriptExportParams reads public fields from starter", () => {
  const result = parseJavaLanguageScriptExportParams(SCRIPT_FUNCTION_STARTERS.java);
  assert.deepEqual(result.inputLabels, ["name - String", "count - double", "enabled - boolean"]);
  assert.deepEqual(result.outputLabels, ["message - String", "score - double", "ok - boolean"]);
});

test("parseScriptExportParams dispatches by language including typescript starter", () => {
  const ts = parseScriptExportParams("typescript", SCRIPT_FUNCTION_STARTERS.typescript);
  assert.ok(ts.inputLabels.length >= 2);
  assert.ok(ts.outputLabels.length >= 2);
  assert.match(ts.inputLabels.join("|"), /id - number/);
  assert.match(ts.outputLabels.join("|"), /name - string/);

  const python = parseScriptExportParams("python", SCRIPT_FUNCTION_STARTERS.python);
  assert.equal(python.inputLabels[0], "name - str");

  const empty = parseScriptExportParams("python", "");
  assert.deepEqual(empty, { inputLabels: [], outputLabels: [] });
});
