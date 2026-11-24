import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import {
  addOntologyFunctionScriptTestListItem,
  buildOntologyFunctionScriptTestInputRows,
  buildOntologyFunctionScriptTestInputRowsFromParsed,
  buildOntologyFunctionScriptTestRequest,
  buildOntologyFunctionTestBindingKeys,
  buildOntologyFunctionTestBindingRows,
  buildOntologyFunctionTestRequest,
  removeOntologyFunctionScriptTestListItem,
  writeOntologyFunctionScriptTestParamValue,
} from "../src/utils/mapOntologyFunctionTest.ts";

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

test("test ontology function types expose documented request fields and null data", () => {
  const source = readSource("../src/types/apis/testOntologyFunctionType.ts");
  assert.match(source, /export interface TestOntologyFunctionParams/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /version: string/);
  assert.match(source, /ontologySpaceId: number/);
  assert.match(source, /ontologyIdentifier\?: string/);
  assert.match(source, /variableBindings\?: Record<string, string>/);
  assert.match(source, /parameters\?: TestOntologyFunctionParameterItem\[\]/);
  assert.match(source, /pageNum\?: number/);
  assert.match(source, /pageSize\?: number/);
  assert.match(source, /export interface TestOntologyFunctionParameterItem/);
  assert.match(source, /paramName: string/);
  assert.match(source, /paramType\?: string/);
  assert.match(source, /paramValue\?: unknown/);
  assert.match(source, /fields\?: TestOntologyFunctionParameterItem\[\]/);
  assert.match(source, /export type TestOntologyFunctionData = null/);
  const detail = readSource("../src/types/apis/getOntologyFunctionDetailType.ts");
  assert.match(detail, /paramRole\?: string/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /TestOntologyFunctionData/);
  assert.match(barrel, /TestOntologyFunctionParams/);
  assert.match(barrel, /TestOntologyFunctionParameterItem/);
  assert.match(barrel, /testOntologyFunctionType/);
});

test("test ontology function api posts to ontology function test endpoint", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /testOntologyFunctionInterface/);
  assert.match(source, /params\.ontologySpaceId 对象空间 id/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/test"/);
  assert.match(source, /method: "post"/);
  assert.match(source, /data: params/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /testOntologyFunctionInterface/);
});

test("buildOntologyFunctionTestBindingKeys puts AGGREGATION first then FILTER names", () => {
  const keys = buildOntologyFunctionTestBindingKeys([
    { paramId: 25, paramName: "xingbie", paramType: "STRING", category: "INPUT", paramOrder: 1, description: "", paramRole: "FILTER" },
    { paramId: 26, paramName: "age", paramType: "STRING", category: "INPUT", paramOrder: 2, description: "", paramRole: "FILTER" },
    { paramId: 27, paramName: "target", paramType: "STRING", category: "INPUT", paramOrder: 3, description: "", paramRole: "AGGREGATION" },
  ]);
  assert.deepEqual(keys, ["target", "xingbie", "age"]);
});

test("buildOntologyFunctionTestBindingRows keeps order and maps paramType description", () => {
  const rows = buildOntologyFunctionTestBindingRows([
    {
      paramId: 2293,
      paramName: "mtype",
      paramType: "STRING",
      category: "INPUT",
      paramOrder: 1,
      description: "过滤条件",
      paramRole: "FILTER",
    },
    {
      paramId: 2294,
      paramName: "amount",
      paramType: "STRING",
      category: "INPUT",
      paramOrder: 2,
      description: "聚合目标",
      paramRole: "AGGREGATION",
    },
  ]);
  assert.deepEqual(rows, [
    { paramName: "amount", paramType: "STRING", description: "聚合目标" },
    { paramName: "mtype", paramType: "STRING", description: "过滤条件" },
  ]);
});

test("buildOntologyFunctionTestRequest assembles functionApi version ontologyIdentifier and bindings", () => {
  const request = buildOntologyFunctionTestRequest({
    functionApi: "ss",
    version: "1.0.0",
    ontologySpaceId: 46,
    ontologyIdentifier: "ont-1",
    bindingKeys: ["target", "age"],
    propertyBindings: { target: "prop_a", age: "prop_b" },
  });
  assert.equal(request.functionApi, "ss");
  assert.equal(request.version, "1.0.0");
  assert.equal(request.ontologySpaceId, 46);
  assert.equal(request.ontologyIdentifier, "ont-1");
  assert.deepEqual(request.variableBindings, { target: "prop_a", age: "prop_b" });
  assert.equal(request.pageNum, 1);
  assert.equal(request.pageSize, 10);
});

test("buildOntologyFunctionScriptTestInputRows keeps INPUT only sorted by paramOrder", () => {
  const rows = buildOntologyFunctionScriptTestInputRows([
    { paramId: 1, paramName: "b", paramType: "STRING", category: "INPUT", paramOrder: 2 },
    { paramId: 2, paramName: "out", paramType: "STRING", category: "OUTPUT", paramOrder: 1 },
    { paramId: 3, paramName: "a", paramType: "NUMBER", category: "input", paramOrder: 1 },
  ]);
  assert.deepEqual(rows, [
    { paramName: "a", paramType: "NUMBER", paramValue: "" },
    { paramName: "b", paramType: "STRING", paramValue: "" },
  ]);
});

test("buildOntologyFunctionScriptTestInputRows keeps nested fields and leaf values", () => {
  const rows = buildOntologyFunctionScriptTestInputRows([
    {
      paramName: "input",
      paramType: "OBJECT",
      category: "INPUT",
      paramOrder: 2,
      fields: [
        { paramName: "b", paramType: "LIST", category: "INPUT", paramOrder: 2 },
        {
          paramName: "a",
          paramType: "OBJECT",
          category: "INPUT",
          paramOrder: 1,
          fields: [{ paramName: "aa", paramType: "STRING", category: "INPUT", paramOrder: 1, fields: [] }],
        },
      ],
    },
    { paramName: "age", paramType: "DOUBLE", category: "INPUT", paramOrder: 1 },
    {
      paramName: "out",
      paramType: "OBJECT",
      category: "OUTPUT",
      paramOrder: 1,
      fields: [{ paramName: "id", paramType: "DOUBLE", category: "OUTPUT", paramOrder: 1 }],
    },
  ]);
  assert.deepEqual(rows, [
    { paramName: "age", paramType: "DOUBLE", paramValue: "" },
    {
      paramName: "input",
      paramType: "OBJECT",
      fields: [
        {
          paramName: "a",
          paramType: "OBJECT",
          fields: [{ paramName: "aa", paramType: "STRING", paramValue: "" }],
        },
        { paramName: "b", paramType: "LIST", paramValue: "" },
      ],
    },
  ]);
});

test("buildOntologyFunctionScriptTestInputRows initializes LIST fields as one empty list item", () => {
  const rows = buildOntologyFunctionScriptTestInputRows([
    {
      paramName: "orders",
      paramType: "LIST",
      category: "INPUT",
      paramOrder: 1,
      fields: [
        { paramName: "id", paramType: "STRING", category: "INPUT", paramOrder: 1 },
        { paramName: "amount", paramType: "DOUBLE", category: "INPUT", paramOrder: 2 },
      ],
    },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.paramName, "orders");
  assert.equal(rows[0]?.paramType, "LIST");
  assert.deepEqual(rows[0]?.fields, [
    { paramName: "id", paramType: "STRING", paramValue: "" },
    { paramName: "amount", paramType: "DOUBLE", paramValue: "" },
  ]);
  assert.equal(rows[0]?.listItems?.length, 1);
  assert.deepEqual(rows[0]?.listItems?.[0], [
    { paramName: "id", paramType: "STRING", paramValue: "" },
    { paramName: "amount", paramType: "DOUBLE", paramValue: "" },
  ]);
});

test("buildOntologyFunctionScriptTestRequest keeps nested fields and leaf values", () => {
  const request = buildOntologyFunctionScriptTestRequest({
    functionApi: "smoke.hello.ts",
    version: "1.0.0",
    ontologySpaceId: 12,
    rows: [
      {
        paramName: "input",
        paramType: "OBJECT",
        fields: [
          {
            paramName: "a",
            paramType: "OBJECT",
            fields: [{ paramName: "aa", paramType: "STRING", paramValue: "leaf" }],
          },
        ],
      },
    ],
  });
  assert.deepEqual(request.parameters, [
    {
      paramName: "input",
      paramType: "OBJECT",
      paramValue: { a: { aa: "leaf" } },
    },
  ]);
});

test("buildOntologyFunctionScriptTestRequest assembles functionApi version and parameters", () => {
  const request = buildOntologyFunctionScriptTestRequest({
    functionApi: "smoke.hello.py",
    version: "1.0.0",
    ontologySpaceId: 7,
    rows: [{ paramName: "name", paramType: "STRING", paramValue: "foundry" }],
  });
  assert.deepEqual(request, {
    functionApi: "smoke.hello.py",
    version: "1.0.0",
    ontologySpaceId: 7,
    parameters: [{ paramName: "name", paramType: "STRING", paramValue: "foundry" }],
  });
});

test("buildOntologyFunctionScriptTestRequest serializes LIST items and typed scalars", () => {
  const request = buildOntologyFunctionScriptTestRequest({
    functionApi: "customer_bill",
    version: "1.0.0",
    ontologySpaceId: 1,
    rows: [
      {
        paramName: "orders",
        paramType: "LIST",
        fields: [
          { paramName: "id", paramType: "STRING", paramValue: "" },
          { paramName: "customerName", paramType: "STRING", paramValue: "" },
          { paramName: "amount", paramType: "DOUBLE", paramValue: "" },
        ],
        listItems: [
          [
            { paramName: "id", paramType: "STRING", paramValue: "o1" },
            { paramName: "customerName", paramType: "STRING", paramValue: "客户A" },
            { paramName: "amount", paramType: "DOUBLE", paramValue: "35.5" },
          ],
          [
            { paramName: "id", paramType: "STRING", paramValue: "o2" },
            { paramName: "customerName", paramType: "STRING", paramValue: "客户B" },
            { paramName: "amount", paramType: "DOUBLE", paramValue: "20" },
          ],
        ],
      },
      { paramName: "minOrders", paramType: "INTEGER", paramValue: "2" },
      { paramName: "labelPrefix", paramType: "STRING", paramValue: "VIP-" },
      { paramName: "applyDiscount", paramType: "BOOL", paramValue: "true" },
    ],
  });
  assert.deepEqual(request.parameters, [
    {
      paramName: "orders",
      paramType: "LIST",
      paramValue: [
        { id: "o1", customerName: "客户A", amount: 35.5 },
        { id: "o2", customerName: "客户B", amount: 20 },
      ],
    },
    { paramName: "minOrders", paramType: "INTEGER", paramValue: 2 },
    { paramName: "labelPrefix", paramType: "STRING", paramValue: "VIP-" },
    { paramName: "applyDiscount", paramType: "BOOL", paramValue: true },
  ]);
});

test("add and remove OntologyFunctionScriptTestListItem clones template fields", () => {
  const initial = buildOntologyFunctionScriptTestInputRows([
    {
      paramName: "orders",
      paramType: "LIST",
      category: "INPUT",
      paramOrder: 1,
      fields: [
        { paramName: "id", paramType: "STRING", category: "INPUT", paramOrder: 1 },
        { paramName: "amount", paramType: "DOUBLE", category: "INPUT", paramOrder: 2 },
      ],
    },
  ]);
  const withValue = writeOntologyFunctionScriptTestParamValue(initial, [0, 0, 0], "o1");
  const added = addOntologyFunctionScriptTestListItem(withValue, [0]);
  assert.equal(added[0]?.listItems?.length, 2);
  assert.equal(added[0]?.listItems?.[0]?.[0]?.paramValue, "o1");
  assert.equal(added[0]?.listItems?.[1]?.[0]?.paramValue, "");
  const removed = removeOntologyFunctionScriptTestListItem(added, [0], 0);
  assert.equal(removed[0]?.listItems?.length, 1);
  assert.equal(removed[0]?.listItems?.[0]?.[0]?.paramValue, "");
  assert.equal(addOntologyFunctionScriptTestListItem(initial, [9]), initial);
  assert.equal(removeOntologyFunctionScriptTestListItem(initial, [0], 9), initial);
  assert.equal(writeOntologyFunctionScriptTestParamValue(initial, [0, 9, 0], "x"), initial);
});

test("nested LIST inside OBJECT supports add remove and typed leaf coercion edges", () => {
  const rows = buildOntologyFunctionScriptTestInputRows([
    {
      paramName: "payload",
      paramType: "OBJECT",
      category: "INPUT",
      paramOrder: 1,
      fields: [
        {
          paramName: "orders",
          paramType: "LIST",
          category: "INPUT",
          paramOrder: 1,
          fields: [
            { paramName: "id", paramType: "STRING", category: "INPUT", paramOrder: 1 },
            { paramName: "amount", paramType: "DOUBLE", category: "INPUT", paramOrder: 2 },
          ],
        },
      ],
    },
    { paramName: "flag", paramType: "BOOLEAN", category: "INPUT", paramOrder: 2 },
    { paramName: "rawList", paramType: "LIST", category: "INPUT", paramOrder: 3 },
    { paramName: "count", paramType: "LONG", category: "INPUT", paramOrder: 4 },
  ]);
  const added = addOntologyFunctionScriptTestListItem(rows, [0, 0]);
  assert.equal(added[0]?.fields?.[0]?.listItems?.length, 2);
  const written = writeOntologyFunctionScriptTestParamValue(added, [0, 0, 1, 0], "nested-id");
  assert.equal(written[0]?.fields?.[0]?.listItems?.[1]?.[0]?.paramValue, "nested-id");
  const removed = removeOntologyFunctionScriptTestListItem(written, [0, 0], 0);
  assert.equal(removed[0]?.fields?.[0]?.listItems?.length, 1);
  const withScalars = writeOntologyFunctionScriptTestParamValue(
    writeOntologyFunctionScriptTestParamValue(writeOntologyFunctionScriptTestParamValue(removed, [1], "false"), [2], "[1,2"),
    [3],
    "",
  );
  const withValidList = writeOntologyFunctionScriptTestParamValue(withScalars, [2], "[1,2]");
  const withBadNumber = writeOntologyFunctionScriptTestParamValue(withValidList, [3], "NaN-like");
  const request = buildOntologyFunctionScriptTestRequest({
    functionApi: "nested.list",
    version: "1.0.0",
    ontologySpaceId: 3,
    rows: withBadNumber,
  });
  assert.deepEqual(request.parameters?.[1], { paramName: "flag", paramType: "BOOLEAN", paramValue: false });
  assert.deepEqual(request.parameters?.[2], { paramName: "rawList", paramType: "LIST", paramValue: [1, 2] });
  assert.deepEqual(request.parameters?.[3], { paramName: "count", paramType: "LONG", paramValue: "NaN-like" });
  const invalidJson = writeOntologyFunctionScriptTestParamValue(withBadNumber, [2], "[1,");
  const invalidRequest = buildOntologyFunctionScriptTestRequest({
    functionApi: "nested.list",
    version: "1.0.0",
    ontologySpaceId: 3,
    rows: invalidJson,
  });
  assert.equal(invalidRequest.parameters?.[2]?.paramValue, "[1,");
});

test("LIST nested under another LIST item can add and remove groups", () => {
  const rows = buildOntologyFunctionScriptTestInputRows([
    {
      paramName: "batches",
      paramType: "LIST",
      category: "INPUT",
      paramOrder: 1,
      fields: [
        {
          paramName: "orders",
          paramType: "LIST",
          category: "INPUT",
          paramOrder: 1,
          fields: [{ paramName: "id", paramType: "STRING", category: "INPUT", paramOrder: 1 }],
        },
      ],
    },
  ]);
  const addedInner = addOntologyFunctionScriptTestListItem(rows, [0, 0, 0]);
  assert.equal(addedInner[0]?.listItems?.[0]?.[0]?.listItems?.length, 2);
  const removedInner = removeOntologyFunctionScriptTestListItem(addedInner, [0, 0, 0], 1);
  assert.equal(removedInner[0]?.listItems?.[0]?.[0]?.listItems?.length, 1);
  assert.equal(removeOntologyFunctionScriptTestListItem(rows, [0, 9], 0), rows);
  assert.equal(addOntologyFunctionScriptTestListItem(rows, [0, 9]), rows);
  const sparse = [];
  sparse.length = 1;
  assert.equal(writeOntologyFunctionScriptTestParamValue(sparse, [0], "x"), sparse);
  assert.equal(addOntologyFunctionScriptTestListItem(sparse, [0]), sparse);
  assert.equal(removeOntologyFunctionScriptTestListItem(sparse, [0], 0), sparse);
  const emptyNumber = buildOntologyFunctionScriptTestRequest({
    functionApi: "edges",
    version: "1.0.0",
    ontologySpaceId: 1,
    rows: [
      { paramName: "i", paramType: "INTEGER", paramValue: "" },
      { paramName: "d", paramType: "DOUBLE", paramValue: "" },
      { paramName: "b", paramType: "BOOL", paramValue: "maybe" },
      { paramName: "f", paramType: "FLOAT", paramValue: "not-a-number" },
    ],
  });
  assert.deepEqual(emptyNumber.parameters, [
    { paramName: "i", paramType: "INTEGER", paramValue: "" },
    { paramName: "d", paramType: "DOUBLE", paramValue: "" },
    { paramName: "b", paramType: "BOOL", paramValue: "maybe" },
    { paramName: "f", paramType: "FLOAT", paramValue: "not-a-number" },
  ]);
});

test("buildOntologyFunctionScriptTestInputRowsFromParsed keeps INPUT tree for ide test form", () => {
  const rows = buildOntologyFunctionScriptTestInputRowsFromParsed([
    {
      paramName: "input",
      paramType: "OBJECT",
      category: "INPUT",
      paramOrder: 1,
      referenceType: "",
      fields: [
        { paramName: "str1", paramType: "STRING", category: "INPUT", paramOrder: 1, referenceType: "" },
        { paramName: "str2", paramType: "STRING", category: "INPUT", paramOrder: 2, referenceType: "" },
      ],
    },
    { paramName: "Output", paramType: "OBJECT", category: "OUTPUT", paramOrder: 1, referenceType: "" },
  ]);
  assert.deepEqual(rows, [
    {
      paramName: "input",
      paramType: "OBJECT",
      fields: [
        { paramName: "str1", paramType: "STRING", paramValue: "" },
        { paramName: "str2", paramType: "STRING", paramValue: "" },
      ],
    },
  ]);
});

test("writeOntologyFunctionScriptTestParamValue updates nested leaf by path", () => {
  const rows = [
    {
      paramName: "input",
      paramType: "OBJECT",
      fields: [
        { paramName: "str1", paramType: "STRING", paramValue: "" },
        { paramName: "str2", paramType: "STRING", paramValue: "" },
      ],
    },
  ];
  const next = writeOntologyFunctionScriptTestParamValue(rows, [0, 1], "hello");
  assert.equal(next[0]?.fields?.[1]?.paramValue, "hello");
  assert.equal(rows[0]?.fields?.[1]?.paramValue, "");
});

test("function operator script ide test uses param tree and list-style request", () => {
  const scriptIdeSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue");
  assert.match(scriptIdeSource, /FunctionOperatorScriptTestParamTree/);
  assert.match(scriptIdeSource, /buildOntologyFunctionScriptTestInputRowsFromParsed/);
  assert.match(scriptIdeSource, /buildOntologyFunctionScriptTestRequest/);
  assert.match(scriptIdeSource, /ontologySpaceId:\s*props\.spaceId/);
  assert.match(scriptIdeSource, /testOntologyFunctionInterface/);
  assert.match(scriptIdeSource, /async function runScriptIdeTest/);
  assert.match(scriptIdeSource, /refreshIdeTestInputRows/);
  assert.match(scriptIdeSource, /addOntologyFunctionScriptTestListItem/);
  assert.match(scriptIdeSource, /removeOntologyFunctionScriptTestListItem/);
  assert.doesNotMatch(scriptIdeSource, /notifyScriptFeatureUnavailable\(['"]测试['"]\)/);
  assert.doesNotMatch(scriptIdeSource, /update:testParams/);
  assert.doesNotMatch(scriptIdeSource, /type:\s*["']CUSTOMIZE["']/);
});

test("script test param tree supports list item add and remove events", () => {
  const treeSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestParamTree.vue");
  assert.match(treeSource, /add-list-item/);
  assert.match(treeSource, /remove-list-item/);
  assert.match(treeSource, /listItems/);
  assert.match(treeSource, /添加一组/);
  assert.match(treeSource, /toggleScriptTestListItemCollapse/);
  assert.match(treeSource, /ArrowDown/);
  assert.match(treeSource, /ArrowRight/);
  assert.match(treeSource, /折叠第 \$\{itemIndex \+ 1\} 组参数/);
  assert.match(treeSource, /v-show="!isScriptTestListItemCollapsed/);
});

test("function operator openTest loads detail and runTest shows output panel", () => {
  const workspace = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  const panel = readSource("../src/views/FunctionOperatorPanel/index.vue");
  assert.match(workspace, /getOntologyFunctionDetailInterface/);
  assert.match(workspace, /testOntologyFunctionInterface/);
  assert.match(workspace, /async function openTest/);
  assert.match(workspace, /buildOntologyFunctionTestBindingRows/);
  assert.match(workspace, /ontologySpaceId:\s*spaceId\.value/);
  assert.match(workspace, /testBindingRows/);
  assert.match(workspace, /getOntologyCategoryTreeInterface/);
  assert.match(workspace, /getOntologyPropertyByOntologyIdInterface/);
  assert.match(workspace, /async function runTest/);
  assert.match(workspace, /testOutput\.value\s*=/);
  assert.match(workspace, /ElMessage\.success\("测试成功"\)/);
  assert.doesNotMatch(workspace, /testFunctionOperatorMock/);
  assert.match(panel, /function-operator-test/);
  assert.match(panel, /选择对象/);
  assert.match(panel, /输出结果/);
  assert.match(panel, /function-operator-test__io/);
  assert.match(panel, /function-operator-test__param-meta/);
  assert.match(panel, /类型：\{\{ row\.paramType \|\| "—" \}\}/);
  assert.match(panel, /描述：\{\{ row\.description \|\| "—" \}\}/);
  assert.match(panel, /width="960px"/);
  assert.doesNotMatch(panel, /function-operator-panel__test-result/);
});

test("function operator script test uses dedicated dialog and parameters body", () => {
  const workspace = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  const panel = readSource("../src/views/FunctionOperatorPanel/index.vue");
  const dialog = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestDialog.vue");
  assert.match(workspace, /isScriptFunctionOperator/);
  assert.match(workspace, /type === "code"/);
  assert.match(workspace, /type === "api"/);
  assert.match(workspace, /type === "docker"/);
  assert.match(workspace, /type === "composite"/);
  assert.match(workspace, /apiModelType === "CUSTOMIZE"/);
  assert.match(workspace, /apiModelType === "EXTERNAL"/);
  assert.match(workspace, /apiModelType === "CONTAINER"/);
  assert.match(workspace, /apiModelType === "COMPOSITE"/);
  assert.match(dialog, /外部 API 函数测试/);
  assert.match(dialog, /容器算子测试/);
  assert.match(dialog, /函数编排测试/);

  assert.match(panel, /:function-type="scriptTestingOperator\?\.type/);
  assert.match(workspace, /async function openScriptTest/);
  assert.match(workspace, /async function runScriptTest/);
  assert.match(workspace, /buildOntologyFunctionScriptTestInputRows/);
  assert.match(workspace, /buildOntologyFunctionScriptTestRequest/);
  assert.match(workspace, /ontologySpaceId:\s*spaceId\.value/);
  assert.match(workspace, /updateScriptTestParamValue/);
  assert.match(dialog, /脚本函数测试/);
  assert.match(dialog, /:close-on-click-modal="false"/);
  assert.match(dialog, /执行结果/);
  assert.match(dialog, /FunctionOperatorScriptTestParamTree/);
  const tree = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestParamTree.vue");
  assert.match(tree, /formatScriptTestParamLabel/);
  assert.match(tree, /row\.fields && row\.fields\.length > 0/);
  assert.match(workspace, /function updateScriptTestParamValue\(path: number\[\], paramValue: string\)/);
  assert.match(panel, /FunctionOperatorScriptTestDialog/);
  assert.match(panel, /scriptTestVisible/);
  assert.match(panel, /runScriptTest/);
});
