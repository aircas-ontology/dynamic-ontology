import assert from "node:assert/strict";
import test from "node:test";

import { parseTypescriptScriptExportParams } from "../src/views/FunctionOperatorPanel/utils/parseTypescriptScriptExportParams.ts";

test("parses export function input and output from interfaces", () => {
  const source = `
interface ExecuteInput {
  name: string;
  count: number;
  enabled: boolean;
}

interface ExecuteOutput {
  message: string;
  score: number;
  ok: boolean;
}

export function execute(input: ExecuteInput): ExecuteOutput {
  return {
    message: input.name,
    score: input.count,
    ok: input.enabled,
  };
}
`;
  const result = parseTypescriptScriptExportParams(source);
  assert.deepEqual(result.inputLabels, ["name - string", "count - number", "enabled - boolean"]);
  assert.deepEqual(result.outputLabels, ["message - string", "score - number", "ok - boolean"]);
});

test("infers output from return object when return type is any", () => {
  const source = `
export function handle(input: any): any {
    const name = (input && input.name) ? input.name : 'world';
    return {
        data: 'hello ' + String(name),
        description: 'from ts runner',
        status: 'SUCCESS'
    };
}
`;
  const result = parseTypescriptScriptExportParams(source);
  assert.deepEqual(result.inputLabels, []);
  assert.deepEqual(result.outputLabels, ["data - string", "description - string", "status - string"]);
});

test("ignores non-exported functions", () => {
  const source = `
function handle(input: { name: string }): { ok: boolean } {
  return { ok: true };
}
`;
  const result = parseTypescriptScriptExportParams(source);
  assert.deepEqual(result.inputLabels, []);
  assert.deepEqual(result.outputLabels, []);
});

test("uses the first export function when multiple exports exist", () => {
  const source = `
export function first(input: { a: string }): { x: number } {
  return { x: 1 };
}
export function second(input: { b: boolean }): { y: string } {
  return { y: "ok" };
}
`;
  const result = parseTypescriptScriptExportParams(source);
  assert.deepEqual(result.inputLabels, ["a - string"]);
  assert.deepEqual(result.outputLabels, ["x - number"]);
});

test("parses inline object types on export async function", () => {
  const source = `
export async function run(payload: { id: string; total: number }): Promise<{ done: boolean }> {
  return { done: true };
}
`;
  const result = parseTypescriptScriptExportParams(source);
  assert.deepEqual(result.inputLabels, ["id - string", "total - number"]);
  assert.deepEqual(result.outputLabels, ["done - boolean"]);
});
