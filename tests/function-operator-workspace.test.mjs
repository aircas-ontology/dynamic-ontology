import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  createDefaultBasicParameterConfig,
  createFunctionOperatorMock,
  queryFunctionOperatorsMock,
} from "../src/mocks/functionOperatorMock/functionOperatorMock.ts";
import { parseBasicFilterConfig, stringifyBasicFilterConfig } from "../src/utils/functionOperatorBasicFilter.ts";

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

test("function-operator route mounts FunctionOperatorPanel", () => {
  const routeSource = readSource("../src/router/modules/workspaceRoutes.ts");
  const functionOperatorBlock = routeSource.match(
    /path:\s*"function-operator"[\s\S]*?meta:\s*\{\s*title:\s*"空间内管理",\s*workspaceTab:\s*"function-operator"\s*\}/,
  );
  assert.ok(functionOperatorBlock, "function-operator route block missing");
  assert.match(functionOperatorBlock[0], /FunctionOperatorPanel\.vue/);
  assert.doesNotMatch(functionOperatorBlock[0], /emptyWorkspacePanel/);
});

test("basic filter config round-trips through parse and stringify", () => {
  const raw = createDefaultBasicParameterConfig();
  const doc = parseBasicFilterConfig(raw);
  assert.equal(doc.logic, "AND");
  assert.ok(doc.children.length >= 1);
  const again = parseBasicFilterConfig(stringifyBasicFilterConfig(doc));
  assert.equal(again.logic, doc.logic);
  assert.equal(again.children.length, doc.children.length);
});

test("function operator mock seeds basic operators and supports create", () => {
  const page = queryFunctionOperatorsMock({
    spaceId: 99,
    keyword: "",
    type: "basic",
    creator: "",
    status: "",
    updatedFrom: "",
    updatedTo: "",
    page: 1,
    pageSize: 8,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  assert.ok(page.total >= 3);
  assert.ok(page.records.every((item) => item.type === "basic"));

  const created = createFunctionOperatorMock({
    spaceId: 99,
    name: "单元测试基础函数",
    type: "basic",
    protocol: "HTTP",
    version: "v1.0.0",
    description: "测试创建",
    createdBy: "tester",
    status: "draft",
    category: "基础操作",
    inputParameters: [],
    outputParameters: [],
    timeout: 5000,
    retryCount: 0,
    retryInterval: 0,
    definition: { kind: "basic", parameterConfig: createDefaultBasicParameterConfig() },
    dependencies: [],
    testStatus: "untested",
    testedAt: "",
  });
  assert.equal(created.type, "basic");
  assert.match(created.name, /单元测试基础函数/);
});

test("function operator panel wires workspace composable and basic form", () => {
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorPanel.vue");
  const formSource = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorFormDialog.vue");
  assert.match(panelSource, /useFunctionOperatorWorkspace/);
  assert.match(panelSource, /FunctionOperatorFormDialog/);
  assert.match(panelSource, /FunctionOperatorDetailDrawer/);
  assert.doesNotMatch(panelSource, /运行配置/);
  assert.match(formSource, /FunctionOperatorBasicFilterBuilder/);
  assert.match(formSource, /本阶段暂未开放/);
});
