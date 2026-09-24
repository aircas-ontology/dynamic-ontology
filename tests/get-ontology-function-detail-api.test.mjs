import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { mapOntologyFunctionQueryConfigToBasicFilter, stringifyBasicFilterConfig } from "../src/utils/functionOperatorBasicFilter.ts";
import { mapOntologyFunctionDetailToDraft, mapOntologyFunctionDetailToOperator } from "../src/utils/mapOntologyFunctionDetail.ts";

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

test("get ontology function detail types expose documented fields", () => {
  const source = readSource("../src/types/apis/getOntologyFunctionDetailType.ts");
  assert.match(source, /export interface GetOntologyFunctionDetailParams/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /export interface GetOntologyFunctionDetailData/);
  assert.match(source, /displayName: string/);
  assert.match(source, /description: string/);
  assert.match(source, /model: string/);
  assert.match(source, /type: string/);
  assert.match(source, /ontologySpaceId: number/);
  assert.match(source, /params: GetOntologyFunctionDetailParamItem\[\]/);
  assert.match(source, /code: string/);
  assert.match(source, /queryConfig\?: CreateOntologyFunctionQueryConfig/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /GetOntologyFunctionDetailData/);
  assert.match(barrel, /getOntologyFunctionDetailType/);
});

test("get ontology function detail api gets detail by functionApi query", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /getOntologyFunctionDetailInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/detail"/);
  assert.match(source, /method: "get"/);
  assert.match(source, /params/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /getOntologyFunctionDetailInterface/);
});

test("get ontology function detail mock mirrors SUCCESS sample", () => {
  const source = readSource("../src/mocks/getOntologyFunctionDetailMock/getOntologyFunctionDetailMock.ts");
  assert.match(source, /export const getOntologyFunctionDetailMock/);
  assert.match(source, /code: 200/);
  assert.match(source, /message: "SUCCESS"/);
  assert.match(source, /success: true/);
  assert.match(source, /functionApi: "ss"/);
  assert.match(source, /type: "BASIC_QUERY"/);
});

test("mapOntologyFunctionQueryConfigToBasicFilter maps dataType to valueType", () => {
  const doc = mapOntologyFunctionQueryConfigToBasicFilter({
    filters: {
      logic: "AND",
      children: [
        {
          type: "FILTER",
          filter: { propertyApiName: "age", op: "EQ", value: "10", dataType: "STRING" },
        },
        {
          type: "FILTER",
          filter: { propertyApiName: "amount", op: "GT", value: 100, dataType: "NUMBER" },
        },
      ],
    },
    aggFunc: "SUM",
  });
  assert.equal(doc.logic, "AND");
  assert.equal(doc.children[0]?.filter?.valueType, "string");
  assert.equal(doc.children[0]?.filter?.value, "10");
  assert.equal(doc.children[1]?.filter?.valueType, "number");
  assert.equal(doc.children[1]?.filter?.value, 100);
  assert.match(stringifyBasicFilterConfig(doc), /"propertyApiName": "age"/);
});

test("mapOntologyFunctionDetailToDraft fills basic form fields from detail", () => {
  const draft = mapOntologyFunctionDetailToDraft(
    {
      functionApi: "ss",
      displayName: "ss",
      description: "ss",
      model: "BASIC",
      type: "BASIC_QUERY",
      ontologySpaceId: 46,
      params: [],
      code: "{}",
      queryConfig: {
        filters: {
          logic: "AND",
          children: [{ type: "FILTER", filter: { propertyApiName: "age", op: "EQ", value: "10", dataType: "STRING" } }],
        },
      },
    },
    46,
  );
  assert.equal(draft.name, "ss");
  assert.equal(draft.functionApi, "ss");
  assert.equal(draft.description, "ss");
  assert.equal(draft.type, "basic");
  assert.equal(draft.definition.kind, "basic");
  if (draft.definition.kind === "basic") {
    assert.equal(draft.definition.aggFunc, "");
    assert.match(draft.definition.parameterConfig, /"propertyApiName": "age"/);
  }
});

test("function operator openEdit fetches detail before opening form", () => {
  const workspace = readSource("../src/views/OntologySpaceManagementDetail/composables/useFunctionOperatorWorkspace.ts");
  assert.match(workspace, /getOntologyFunctionDetailInterface/);
  assert.match(workspace, /mapOntologyFunctionDetailToDraft/);
  assert.match(workspace, /async function openEdit/);
  assert.match(workspace, /formDraft\.value\s*=/);
  assert.match(workspace, /formVisible\.value\s*=\s*true/);
  const openEditBlock = workspace.slice(workspace.indexOf("async function openEdit"), workspace.indexOf("async function saveOperator"));
  assert.ok(
    openEditBlock.indexOf("formVisible.value = true") < openEditBlock.indexOf("getOntologyFunctionDetailInterface"),
    "formVisible must open before detail request",
  );
});

test("mapOntologyFunctionDetailToOperator fills input params from detail", () => {
  const operator = mapOntologyFunctionDetailToOperator(
    {
      functionApi: "ss",
      displayName: "ss",
      description: "ss",
      model: "BASIC",
      type: "BASIC_QUERY",
      ontologySpaceId: 46,
      params: [
        {
          paramId: 25,
          paramName: "xingbie",
          paramType: "STRING",
          category: "INPUT",
          paramOrder: 1,
          description: "过滤条件",
          paramRole: "FILTER",
        },
        {
          paramId: 27,
          paramName: "target",
          paramType: "STRING",
          category: "INPUT",
          paramOrder: 3,
          description: "聚合目标",
          paramRole: "AGGREGATION",
        },
      ],
      code: "{}",
      queryConfig: {
        filters: {
          logic: "AND",
          children: [{ type: "FILTER", filter: { propertyApiName: "age", op: "EQ", value: "10", dataType: "STRING" } }],
        },
      },
    },
    {
      id: "ss",
      spaceId: 46,
      name: "列表名",
      functionApi: "ss",
      description: "",
      type: "basic",
      apiModelType: "BASIC_QUERY",
      protocol: "",
      version: "",
      createdBy: "",
      updatedAt: "2026-09-24 11:35:18",
      status: "",
      category: "",
      inputParameters: [],
      outputParameters: [],
      timeout: 0,
      retryCount: 0,
      retryInterval: 0,
      definition: { kind: "basic", parameterConfig: "" },
      dependencies: [],
      testStatus: "untested",
      testedAt: "",
      versions: [],
    },
  );
  assert.equal(operator.name, "ss");
  assert.equal(operator.updatedAt, "2026-09-24 11:35:18");
  assert.equal(operator.inputParameters.length, 2);
  assert.equal(operator.inputParameters[0]?.name, "xingbie");
  assert.match(operator.inputParameters[0]?.description ?? "", /FILTER/);
  assert.equal(operator.outputParameters.length, 0);
  assert.equal(operator.definition.kind, "basic");
  if (operator.definition.kind === "basic") {
    assert.match(operator.definition.parameterConfig, /"propertyApiName": "age"/);
  }
});

test("function operator openDetail fetches detail for drawer", () => {
  const workspace = readSource("../src/views/OntologySpaceManagementDetail/composables/useFunctionOperatorWorkspace.ts");
  const drawer = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorDetailDrawer.vue");
  assert.match(workspace, /async function openDetail/);
  assert.match(workspace, /mapOntologyFunctionDetailToOperator/);
  assert.match(workspace, /detailLoading/);
  assert.match(drawer, /showOutputParameters/);
  assert.match(drawer, /type === "basic"/);
  assert.match(drawer, /loading/);
  assert.doesNotMatch(drawer, /必填/);
});
