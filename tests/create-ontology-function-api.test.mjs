import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { buildOntologyFunctionQueryConfig, parseBasicFilterConfig } from "../src/utils/functionOperatorBasicFilter.ts";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("create ontology function types expose the documented request fields", () => {
  const source = readSource("../src/types/apis/createOntologyFunctionType.ts");
  assert.match(source, /export interface CreateOntologyFunctionParams/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /displayName: string/);
  assert.match(source, /description: string/);
  assert.match(source, /type: "BASIC_QUERY"/);
  assert.match(source, /ontologySpaceId: number/);
  assert.match(source, /queryConfig\?: CreateOntologyFunctionQueryConfig/);
  assert.match(source, /aggFunc\?: CreateOntologyFunctionAggFunc/);
  assert.match(source, /filters: CreateOntologyFunctionFilters/);
  assert.match(source, /dataType: CreateOntologyFunctionFilterDataType/);
  assert.match(source, /export type CreateOntologyFunctionData = null/);
});

test("create ontology function api posts to ontology function endpoint", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /createOntologyFunctionInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function"/);
  assert.match(source, /method: "post"/);
  assert.match(source, /data: params/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /createOntologyFunctionInterface/);
  assert.match(barrel, /from "\.\/functionApi"/);
});

test("create ontology function mock mirrors SUCCESS envelope with null data", () => {
  const source = readSource("../src/mocks/createOntologyFunctionMock/createOntologyFunctionMock.ts");
  assert.match(source, /export const createOntologyFunctionMock: ApiResponse<CreateOntologyFunctionData>/);
  assert.match(source, /code: 200/);
  assert.match(source, /message: "SUCCESS"/);
  assert.match(source, /success: true/);
  assert.match(source, /data: null/);
});

test("buildOntologyFunctionQueryConfig maps filters dataType and omits empty aggFunc", () => {
  const doc = parseBasicFilterConfig(
    JSON.stringify({
      logic: "AND",
      children: [
        {
          type: "FILTER",
          filter: { op: "EQ", propertyApiName: "status", valueType: "string", value: "1" },
        },
        {
          type: "FILTER",
          filter: { op: "GT", propertyApiName: "amount", valueType: "number", value: 100 },
        },
        {
          type: "FILTER",
          filter: { op: "EQ", propertyApiName: "flag", valueType: "boolean", value: true },
        },
      ],
    }),
  );
  const withoutAgg = buildOntologyFunctionQueryConfig(doc, "");
  assert.equal("aggFunc" in withoutAgg, false);
  assert.equal(withoutAgg.filters.logic, "AND");
  assert.equal(withoutAgg.filters.children[0]?.filter?.dataType, "STRING");
  assert.equal(withoutAgg.filters.children[1]?.filter?.dataType, "NUMBER");
  assert.equal(withoutAgg.filters.children[2]?.filter?.dataType, "BOOLEAN");
  assert.equal(withoutAgg.filters.children[0]?.filter?.value, "1");
  assert.equal(withoutAgg.filters.children[1]?.filter?.value, 100);

  const withAgg = buildOntologyFunctionQueryConfig(doc, "SUM");
  assert.equal(withAgg.aggFunc, "SUM");
});

test("function operator create form exposes aggFunc and workspace posts create api", () => {
  const formSource = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorFormDialog.vue");
  const workspaceSource = readSource("../src/views/OntologySpaceManagementDetail/composables/useFunctionOperatorWorkspace.ts");
  const typeSource = readSource("../src/types/pages/ontologyFunctionOperatorType.ts");
  assert.match(typeSource, /aggFunc\?:/);
  assert.match(formSource, /聚合类型/);
  assert.match(formSource, /FUNCTION_OPERATOR_AGG_FUNC_OPTIONS|aggFunc/);
  assert.match(workspaceSource, /createOntologyFunctionInterface/);
  assert.match(workspaceSource, /BASIC_QUERY/);
  assert.match(workspaceSource, /buildOntologyFunctionQueryConfig/);
  assert.match(workspaceSource, /updateFunctionOperatorMock/);
});
