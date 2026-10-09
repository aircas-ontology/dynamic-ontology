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

  assert.ok(page.records.every((item) => typeof item.functionApi === "string" && item.functionApi.length > 0));

  const created = createFunctionOperatorMock({
    spaceId: 99,
    name: "单元测试基础函数",
    functionApi: "unit_test_basic_fn",
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
  assert.equal(created.functionApi, "unit_test_basic_fn");
});

test("function operator panel wires workspace composable and basic form", () => {
  const typeSource = readSource("../src/types/pages/ontologyFunctionOperatorType.ts");
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorPanel.vue");
  const formSource = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorFormDialog.vue");
  assert.match(panelSource, /useFunctionOperatorWorkspace/);
  assert.match(panelSource, /<el-date-picker[\s\S]*class="aircas-input function-operator-panel__date"[\s\S]*popper-class="aircas-picker"/);
  assert.match(
    panelSource,
    /:deep\(\.function-operator-panel__date\.el-date-editor\)[\s\S]*background-color: var\(--aircas-color-input-background\)[\s\S]*box-shadow: 0 0 0 1px var\(--aircas-color-border\) inset/,
  );
  assert.match(
    panelSource,
    /:deep\(\.function-operator-panel__date\.el-date-editor:hover\)[\s\S]*box-shadow: 0 0 0 1px var\(--aircas-color-border-highlight\) inset/,
  );
  assert.match(panelSource, /:deep\(\.function-operator-panel__date \.el-range-input\)[\s\S]*color: var\(--aircas-color-text-primary\)/);
  assert.doesNotMatch(panelSource, /--aircas-color-cyan-soft/);
  assert.equal((panelSource.match(/<el-tag/g) || []).length, 4);
  assert.equal((panelSource.match(/class="aircas-tag"/g) || []).length, 4);
  assert.match(panelSource, /class="aircas-pagination function-operator-panel__pagination"/);
  assert.match(panelSource, /popper-class="aircas-pagination-popper"/);
  assert.match(panelSource, /function-operator-panel__cards[\s\S]*align-items:\s*start/);
  assert.match(panelSource, /function-operator-card__description[\s\S]*-webkit-line-clamp:\s*2/);
  assert.match(panelSource, /function-operator-card__actions[\s\S]*justify-content:\s*flex-end/);
  assert.match(panelSource, /FunctionOperatorFormDialog/);
  assert.match(panelSource, /FunctionOperatorDetailDrawer/);
  assert.doesNotMatch(panelSource, /运行配置/);
  assert.match(formSource, /FunctionOperatorBasicFilterBuilder/);
  assert.match(formSource, /本阶段暂未开放/);
  assert.match(formSource, /class="aircas-dialog function-operator-form-dialog"/);
  assert.match(formSource, /class="aircas-form function-operator-form"/);
  assert.match(formSource, /class="aircas-empty"/);
  assert.match(formSource, /function-operator-form__name-grid/);
  assert.match(formSource, /label="函数名称"[\s\S]*label="函数api名称"/);
  assert.match(formSource, /prop="functionApi"/);
  assert.match(formSource, /请输入函数api名称/);
  assert.match(formSource, /v-model="form\.functionApi"[\s\S]*:disabled="Boolean\(operator\)"/);
  assert.match(typeSource, /functionApi:\s*string/);
  const filterSource = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/BasicFilterGroupEditor.vue");
  assert.equal((filterSource.match(/<el-select/g) || []).length, 4);
  assert.equal((filterSource.match(/\sclass="aircas-select/g) || []).length, 4);
  assert.equal((filterSource.match(/popper-class="aircas-select-popper"/g) || []).length, 4);
  assert.equal((filterSource.match(/<el-input(?!-)/g) || []).length, 5);
  assert.equal((filterSource.match(/class="aircas-input/g) || []).length, 5);
  assert.match(filterSource, /opNeedsList/);
  assert.match(filterSource, /逗号分隔/);
  assert.match(filterSource, /background: var\(--aircas-color-overlay\)/);
  assert.doesNotMatch(filterSource, /--aircas-color-panel-overlay/);
  assert.match(filterSource, /basic-filter-row__number[\s\S]*--el-fill-color-blank: var\(--aircas-color-input-background\)/);
  const drawerSource = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorDetailDrawer.vue");
  assert.match(drawerSource, /class="aircas-drawer function-operator-detail"/);
  assert.match(drawerSource, /class="aircas-descriptions function-operator-detail__meta"/);
  assert.match(
    drawerSource,
    /function-operator-detail__meta[\s\S]*--el-descriptions-item-bordered-label-background: var\(--aircas-color-panel-background-deep\)/,
  );
  assert.match(
    drawerSource,
    /function-operator-detail__meta :deep\(\.el-descriptions__label.is-bordered-label\)[\s\S]*background: var\(--aircas-color-panel-background-deep\)/,
  );
  assert.match(
    drawerSource,
    /function-operator-detail__meta :deep\(\.el-descriptions__content.is-bordered-content\)[\s\S]*background: var\(--aircas-color-input-background\)/,
  );
  assert.equal((drawerSource.match(/<el-tag/g) || []).length, 3);
  assert.equal((drawerSource.match(/class="aircas-tag"/g) || []).length, 3);
});
