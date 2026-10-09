import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import dayjs from "dayjs";

import { mapOntologyFunctionListItem } from "../src/utils/mapOntologyFunctionList.ts";

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

test("get ontology function list types expose documented request and page fields", () => {
  const source = readSource("../src/types/apis/getOntologyFunctionListType.ts");
  assert.match(source, /export interface GetOntologyFunctionListParams/);
  assert.match(source, /pageNum\?: number/);
  assert.match(source, /pageSize\?: number/);
  assert.match(source, /ontologySpaceId: number/);
  assert.match(source, /export interface GetOntologyFunctionListItem/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /displayName: string/);
  assert.match(source, /description: string/);
  assert.match(source, /type: string/);
  assert.match(source, /updateTime: string/);
  assert.match(source, /export interface GetOntologyFunctionListData/);
  assert.match(source, /records: GetOntologyFunctionListItem\[\]/);
  assert.match(source, /total: number/);
  assert.match(source, /size: number/);
  assert.match(source, /current: number/);
  assert.match(source, /pages: number/);
});

test("get ontology function list api gets the prefixed list endpoint", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /getOntologyFunctionListInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/list"/);
  assert.match(source, /method: "get"/);
  assert.match(source, /params/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /getOntologyFunctionListInterface/);
});

test("get ontology function list mock mirrors the documented sample", () => {
  const source = readSource("../src/mocks/getOntologyFunctionListMock/getOntologyFunctionListMock.ts");
  assert.match(source, /export const getOntologyFunctionListMock: ApiResponse<GetOntologyFunctionListData>/);
  assert.match(source, /code: 200/);
  assert.match(source, /message: "SUCCESS"/);
  assert.match(source, /functionApi: "test"/);
  assert.match(source, /displayName: "测试函数"/);
  assert.match(source, /type: "BASIC_QUERY"/);
  assert.match(source, /updateTime: "2026-09-24T03:35:18\.692\+00:00"/);
  assert.match(source, /functionApi: "addTwoNumbers"/);
  assert.match(source, /type: "CUSTOMIZE"/);
  assert.match(source, /total: 2/);
  assert.match(source, /pages: 1/);
});

test("mapOntologyFunctionListItem fills known fields and leaves others empty", () => {
  const basic = mapOntologyFunctionListItem(
    {
      functionApi: "test",
      displayName: "测试函数",
      description: "测试函数说明",
      type: "BASIC_QUERY",
      updateTime: "2026-09-24T03:35:18.692+00:00",
    },
    11,
  );
  assert.equal(basic.id, "test");
  assert.equal(basic.spaceId, 11);
  assert.equal(basic.name, "测试函数");
  assert.equal(basic.functionApi, "test");
  assert.equal(basic.description, "测试函数说明");
  assert.equal(basic.type, "basic");
  assert.equal(basic.apiModelType, "BASIC_QUERY");
  assert.equal(basic.status, "");
  assert.equal(basic.version, "");
  assert.equal(basic.protocol, "");
  assert.equal(basic.createdBy, "");
  assert.equal(basic.updatedAt, dayjs("2026-09-24T03:35:18.692+00:00").format("YYYY-MM-DD HH:mm:ss"));
  assert.deepEqual(basic.inputParameters, []);
  assert.deepEqual(basic.outputParameters, []);

  const custom = mapOntologyFunctionListItem(
    {
      functionApi: "addTwoNumbers",
      displayName: "两数相加",
      description: "测试用：返回 a+b",
      type: "CUSTOMIZE",
      updateTime: "",
    },
    11,
  );
  assert.equal(custom.apiModelType, "CUSTOMIZE");
  assert.equal(custom.type, "basic");
  assert.equal(custom.updatedAt, "");
});

test("function operator panel displays updatedAt from list mapping", () => {
  const panel = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorPanel.vue");
  assert.match(panel, /\{\{\s*operator\.updatedAt\s*\}\}/);
  assert.match(panel, /prop="updatedAt"/);
});

test("function operator workspace loads list from getOntologyFunctionListInterface", () => {
  const workspace = readSource("../src/views/OntologySpaceManagementDetail/composables/useFunctionOperatorWorkspace.ts");
  const panel = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorPanel.vue");
  assert.match(workspace, /getOntologyFunctionListInterface/);
  assert.match(workspace, /mapOntologyFunctionListItem/);
  assert.match(workspace, /pageNum/);
  assert.match(workspace, /ontologySpaceId:\s*spaceId\.value/);
  assert.doesNotMatch(workspace, /queryFunctionOperatorsMock\(buildQuery\(\)\)/);
  assert.doesNotMatch(workspace, /createFunctionOperatorMock\(draft\)/);
  assert.match(panel, /apiModelType/);
});
