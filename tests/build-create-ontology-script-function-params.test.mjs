import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCreateOntologyScriptFunctionParams,
  mapScriptLanguageFromApi,
  mapScriptLanguageToApi,
} from "../src/views/FunctionOperatorPanel/utils/buildCreateOntologyScriptFunctionParams.ts";

test("mapScriptLanguageToApi maps four UI languages", () => {
  assert.equal(mapScriptLanguageToApi("typescript"), "TYPESCRIPT");
  assert.equal(mapScriptLanguageToApi("groovy"), "GROOVY");
  assert.equal(mapScriptLanguageToApi("python"), "PYTHON");
  assert.equal(mapScriptLanguageToApi("java"), "JAVA");
});

test("mapScriptLanguageFromApi maps API languages and falls back to typescript", () => {
  assert.equal(mapScriptLanguageFromApi("TYPESCRIPT"), "typescript");
  assert.equal(mapScriptLanguageFromApi("groovy"), "groovy");
  assert.equal(mapScriptLanguageFromApi("PYTHON"), "python");
  assert.equal(mapScriptLanguageFromApi("JAVA"), "java");
  assert.equal(mapScriptLanguageFromApi(""), "typescript");
  assert.equal(mapScriptLanguageFromApi(undefined), "typescript");
});

test("buildCreateOntologyScriptFunctionParams builds CUSTOMIZE payload with parameters", () => {
  const payload = buildCreateOntologyScriptFunctionParams({
    functionApi: " smoke.hello.ts ",
    version: " 1.0.0 ",
    displayName: " 冒烟测试函数-TS ",
    description: " TypeScript 脚本链路验证 ",
    ontologySpaceId: 1,
    language: "typescript",
    code: "export function handle(input: User): Output { return { id: 1, name: 'a' }; }",
    parameters: [
      {
        paramName: "input",
        paramType: "OBJECT",
        category: "INPUT",
        paramOrder: 1,
        referenceType: "",
        fields: [
          {
            paramName: "b",
            paramType: "LIST",
            category: "INPUT",
            paramOrder: 2,
            referenceType: "",
          },
          {
            paramName: "a",
            paramType: "STRING",
            category: "INPUT",
            paramOrder: 1,
            referenceType: "",
          },
        ],
      },
      {
        paramName: "Output",
        paramType: "OBJECT",
        category: "OUTPUT",
        paramOrder: 1,
        referenceType: "",
        fields: [
          {
            paramName: "id",
            paramType: "DOUBLE",
            category: "OUTPUT",
            paramOrder: 1,
            referenceType: "",
          },
        ],
      },
    ],
    sourceVersion: "1.0.0",
  });

  assert.equal(payload.type, "CUSTOMIZE");
  assert.equal(payload.language, "TYPESCRIPT");
  assert.equal(payload.functionApi, "smoke.hello.ts");
  assert.equal(payload.version, "1.0.0");
  assert.equal(payload.displayName, "冒烟测试函数-TS");
  assert.equal(payload.description, "TypeScript 脚本链路验证");
  assert.equal(payload.ontologySpaceId, 1);
  assert.equal(payload.basedOnOldVersion, true);
  assert.match(payload.code ?? "", /export function handle/);
  assert.equal(payload.queryConfig, undefined);
  assert.deepEqual(payload.parameters, [
    {
      paramName: "input",
      paramType: "OBJECT",
      category: "INPUT",
      paramOrder: 1,
      referenceType: "",
      fields: [
        { paramName: "a", paramType: "STRING", category: "INPUT", paramOrder: 1, referenceType: "" },
        { paramName: "b", paramType: "LIST", category: "INPUT", paramOrder: 2, referenceType: "" },
      ],
    },
    {
      paramName: "Output",
      paramType: "OBJECT",
      category: "OUTPUT",
      paramOrder: 1,
      referenceType: "",
      fields: [{ paramName: "id", paramType: "DOUBLE", category: "OUTPUT", paramOrder: 1, referenceType: "" }],
    },
  ]);
});

test("buildCreateOntologyScriptFunctionParams allows empty parameters", () => {
  const payload = buildCreateOntologyScriptFunctionParams({
    functionApi: "empty.fn",
    version: "1.0.0",
    displayName: "empty",
    description: "desc",
    ontologySpaceId: 2,
    language: "python",
    code: "def handle():\n  return {}",
    parameters: [],
    sourceVersion: "",
  });
  assert.equal(payload.language, "PYTHON");
  assert.equal(payload.basedOnOldVersion, false);
  assert.deepEqual(payload.parameters, []);
});

test("buildCreateOntologyScriptFunctionParams maps blank sourceVersion to basedOnOldVersion false", () => {
  const payload = buildCreateOntologyScriptFunctionParams({
    functionApi: "fn",
    version: "1.0.0",
    displayName: "n",
    description: "d",
    ontologySpaceId: 1,
    language: "typescript",
    code: "export function handle() { return {}; }",
    parameters: [],
    sourceVersion: "   ",
  });
  assert.equal(payload.basedOnOldVersion, false);
});
