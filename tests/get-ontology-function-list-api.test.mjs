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
  assert.match(source, /displayName\?: string/);
  assert.match(source, /type\?: string/);
  assert.match(source, /publishStatus\?: number/);
  assert.match(source, /startDate\?: string/);
  assert.match(source, /endDate\?: string/);
  assert.match(source, /export interface GetOntologyFunctionListItem/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /displayName: string/);
  assert.match(source, /description: string/);
  assert.match(source, /type: string/);
  assert.match(source, /createTime: string/);
  assert.match(source, /updateTime: string/);
  assert.match(source, /publishStatus: number/);
  assert.match(source, /version: string/);
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
  assert.match(source, /params\.displayName/);
  assert.match(source, /params\.publishStatus/);
  assert.match(source, /params\.startDate/);
  assert.match(source, /params\.endDate/);
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
  assert.match(source, /createTime: "2026-10-12T17:56:02\.614\+00:00"/);
  assert.match(source, /updateTime: "2026-09-24T03:35:18\.692\+00:00"/);
  assert.match(source, /publishStatus: 1/);
  assert.match(source, /version: "1\.0\.0"/);
  assert.match(source, /functionApi: "addTwoNumbers"/);
  assert.match(source, /type: "CUSTOMIZE"/);
  assert.match(source, /publishStatus: 0/);
  assert.match(source, /version: "0\.1\.0"/);
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
      createTime: "2026-10-12T17:56:02.614+00:00",
      updateTime: "2026-09-24T03:35:18.692+00:00",
      publishStatus: 1,
      version: "1.0.0",
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
  assert.equal(basic.status, "published");
  assert.equal(basic.version, "1.0.0");
  assert.equal(basic.protocol, "");
  assert.equal(basic.createdBy, "");
  assert.equal(basic.createdAt, dayjs("2026-10-12T17:56:02.614+00:00").format("YYYY-MM-DD HH:mm:ss"));
  assert.equal(basic.updatedAt, dayjs("2026-09-24T03:35:18.692+00:00").format("YYYY-MM-DD HH:mm:ss"));
  assert.deepEqual(basic.inputParameters, []);
  assert.deepEqual(basic.outputParameters, []);

  const custom = mapOntologyFunctionListItem(
    {
      functionApi: "addTwoNumbers",
      displayName: "两数相加",
      description: "测试用：返回 a+b",
      type: "CUSTOMIZE",
      createTime: "",
      updateTime: "",
      publishStatus: 0,
      version: "0.1.0",
    },
    11,
  );
  assert.equal(custom.apiModelType, "CUSTOMIZE");
  assert.equal(custom.type, "code");
  assert.equal(custom.definition.kind, "code");
  assert.equal(custom.createdAt, "");
  assert.equal(custom.updatedAt, "");
  assert.equal(custom.status, "draft");
  assert.equal(custom.version, "0.1.0");

  const composite = mapOntologyFunctionListItem(
    {
      functionApi: "flowA",
      displayName: "编排A",
      description: "编排说明",
      type: "COMPOSITE",
      createTime: "",
      updateTime: "",
      publishStatus: 0,
      version: "1.0.0",
    },
    11,
  );
  assert.equal(composite.apiModelType, "COMPOSITE");
  assert.equal(composite.type, "composite");
  assert.equal(composite.definition.kind, "composite");

  const unknownStatus = mapOntologyFunctionListItem(
    {
      functionApi: "x",
      displayName: "x",
      description: "",
      type: "BASIC_QUERY",
      createTime: "",
      updateTime: "",
      publishStatus: 9,
      version: "",
    },
    11,
  );
  assert.equal(unknownStatus.status, "");
  assert.equal(unknownStatus.version, "");
});

test("function operator panel displays createdAt and updatedAt from list mapping", () => {
  const panel = readSource("../src/views/FunctionOperatorPanel/index.vue");
  assert.match(panel, /创建时间<br\s*\/?>\s*\{\{\s*operator\.createdAt/);
  assert.match(panel, /更新时间<br\s*\/?>\s*\{\{\s*operator\.updatedAt/);
  assert.match(panel, /prop="createdAt"/);
  assert.match(panel, /prop="updatedAt"/);
  assert.match(panel, /label="创建时间"/);
  const listMap = readSource("../src/utils/mapOntologyFunctionList.ts");
  assert.match(listMap, /createdAt:\s*formatOntologyFunctionListTime\(item\.createTime\)/);
  assert.match(listMap, /updatedAt:\s*formatOntologyFunctionListTime\(item\.updateTime\)/);
});

test("function operator workspace loads list from getOntologyFunctionListInterface", () => {
  const workspace = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  const panel = readSource("../src/views/FunctionOperatorPanel/index.vue");
  assert.match(workspace, /getOntologyFunctionListInterface/);
  assert.match(workspace, /mapOntologyFunctionListItem/);
  assert.match(workspace, /pageNum/);
  assert.match(workspace, /ontologySpaceId:\s*spaceId\.value/);
  assert.match(workspace, /buildOntologyFunctionListQueryParams|displayName:/);
  assert.match(workspace, /mapFunctionOperatorTypeToApi/);
  assert.match(workspace, /startDate/);
  assert.match(workspace, /endDate/);
  assert.match(workspace, /publishStatus/);
  const typeMap = readSource("../src/utils/mapFunctionOperatorTypeToApi.ts");
  assert.match(typeMap, /BASIC_QUERY/);
  assert.match(typeMap, /CUSTOMIZE/);
  assert.match(typeMap, /COMPOSITE/);
  assert.match(typeMap, /docker:\s*"CONTAINER"/);
  assert.match(typeMap, /CONTAINER:\s*"docker"/);
  assert.match(typeMap, /mapFunctionOperatorTypeFromApi/);
  assert.doesNotMatch(workspace, /records\.filter/);
  assert.doesNotMatch(workspace, /queryFunctionOperatorsMock\(buildQuery\(\)\)/);
  assert.doesNotMatch(workspace, /createFunctionOperatorMock\(draft\)/);
  assert.match(panel, /FUNCTION_OPERATOR_TYPE_LABELS\[operator\.type\]/);
  assert.match(panel, /filters\.creator/);
  const listMap = readSource("../src/utils/mapOntologyFunctionList.ts");
  assert.match(listMap, /apiModelType/);
  assert.match(listMap, /mapFunctionOperatorTypeFromApi/);
});
