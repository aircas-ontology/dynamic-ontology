import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { nextTick, reactive, ref, watch } from "vue";
import { loadMockRoutes, matchMockRoute } from "../scripts/mock-server.mjs";
import * as configuration from "../src/views/ObjectWorkspacePanel/utils/buildAssetModelConfiguration.ts";

const dataElement = (name, representation = "") => ({
  id: name,
  name,
  shortName: "",
  apiName: name,
  dataType: "字符串型",
  description: `${name}定义`,
  representation,
  required: false,
  metaList: representation
    ? [
        { label: "数据元标识符", value: name },
        { label: "数据元名称", value: name },
        { label: "数据元值的表示形式", value: representation },
      ]
    : [],
});

/**
 * @description 以真实资产弹窗脚本和可控接口构建测试环境。
 * @param {Function} request 模拟资产创建请求。
 * @returns {object} 弹窗状态、事件和结果。
 */
function createWizard(request, options = {}) {
  const model = { id: "model", apiName: "ship", name: "舰船", description: "舰船说明", properties: [dataElement("舰名", "普通文本"), dataElement("编号")] };
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/AssetModelBuildDialog.vue", import.meta.url), "utf8");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const code = ts.transpile(
    `${script}\nreturn { selectAssetModel, selectAssetProperties, goToObjectInfoStep, confirmAssetCreate, detail, objectPropertyList, objectDraft, visible, error, submitting };`,
    { target: ts.ScriptTarget.ES2022 },
  );
  const events = [];
  const successes = [];
  const errors = [];
  const deps = {
    ...configuration,
    nextTick,
    reactive,
    ref,
    watch,
    onBeforeUnmount: () => {},
    defineModel: () => ref(true),
    defineProps: () => ({ spaceId: "8", categoryTree: [], parentOptions: [], initialCategoryId: "5", ...options }),
    defineEmits: () => (name) => events.push(name),
    assetModelDetailMock: [model],
    postBuildOntologyAssetInterface: request,
    ElMessage: { success: (message) => successes.push(message), error: (message) => errors.push(message) },
  };
  const wizard = new Function(...Object.keys(deps), code)(...Object.values(deps));
  wizard.selectAssetModel({ modelId: "model" });
  wizard.selectAssetProperties([...wizard.detail.value.properties]);
  wizard.goToObjectInfoStep();
  wizard.objectPropertyList.value[0].apiName = "ship_name";
  wizard.objectPropertyList.value[0].isNameKey = true;
  wizard.objectPropertyList.value[1].apiName = "ship_id";
  wizard.objectPropertyList.value[1].isPrimary = true;
  wizard.objectPropertyList.value[1].dataType = "Boolean";
  wizard.objectPropertyList.value[0].defaultValue = "unknown";
  return { wizard, events, successes, errors };
}

test("asset API sends documented POST endpoint and preserves request body", () => {
  const source = readFileSync(new URL("../src/apis/ontologyObjectManageApi.ts", import.meta.url), "utf8");
  const code = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS });
  const api = {};
  new Function("exports", "require", "DOMAIN_CONFIG", code)(api, () => ({ request: (value) => value }), { ONTOLOGYMANAGE_URL: "https://example.test" });
  const payload = { spaceId: 8, properties: [] };
  const request = api.postBuildOntologyAssetInterface(payload);
  assert.equal(request.url, "https://example.test/ontology/meta/build_object");
  assert.equal(request.method, "post");
  assert.equal(request.data, payload);
});

test("asset creation mock resolves to a response containing the new object identifier", async () => {
  const route = matchMockRoute("POST", "/ontology/meta/build_object", await loadMockRoutes());
  assert.ok(route);
  const fixture = JSON.parse(readFileSync(new URL(`../src/mockData/${route.file}`, import.meta.url), "utf8"));
  assert.equal(fixture.code, 200);
  assert.ok(fixture.data.uniqueIdentifier);
});

test("asset create sends edited fields and metadata and refreshes once on success", async () => {
  let resolve;
  let calls = 0;
  let payload;
  const state = createWizard((value) => {
    calls++;
    payload = value;
    return new Promise((done) => {
      resolve = done;
    });
  });
  state.wizard.objectDraft.iconUrl = "/icon.png";
  state.wizard.objectDraft.parentId = "parent";
  const pending = state.wizard.confirmAssetCreate();
  await state.wizard.confirmAssetCreate();
  assert.equal(calls, 1);
  assert.equal(state.wizard.submitting.value, true);
  assert.deepEqual(payload, {
    spaceId: 8,
    displayName: "舰船",
    apiName: "ship",
    description: "舰船说明",
    categoryId: 5,
    groupIds: [],
    properties: [
      {
        displayName: "舰名",
        apiName: "ship_name",
        description: "舰名定义",
        dataType: "String",
        defaultValue: "unknown",
        isPrimaryKey: false,
        isTitleKey: true,
        storageGroup: "main",
        metadata: { 元数据: { 数据元标识符: "舰名", 数据元名称: "舰名", 数据元值的表示形式: "普通文本" } },
      },
      {
        displayName: "编号",
        apiName: "ship_id",
        description: "编号定义",
        dataType: "Bool",
        defaultValue: "",
        isPrimaryKey: true,
        isTitleKey: false,
        storageGroup: "main",
      },
    ],
  });
  resolve({ code: 200, data: { uniqueIdentifier: "new-object" } });
  await pending;
  assert.equal(state.wizard.visible.value, false);
  assert.deepEqual(state.events, ["created"]);
  assert.equal(state.successes.length, 1);
  assert.equal(state.wizard.submitting.value, false);
});

for (const [name, request, expected] of [
  ["business error", async () => ({ code: 500, message: "对象名称已存在" }), "对象名称已存在"],
  [
    "network error",
    async () => {
      throw new Error("网络连接失败");
    },
    "网络连接失败",
  ],
  ["empty error", async () => ({ code: 500, message: "" }), "资产构建对象失败，请重试。"],
]) {
  test(`asset create retains edited state and shows ${name}`, async () => {
    const state = createWizard(request);
    await state.wizard.confirmAssetCreate();
    assert.equal(state.wizard.error.value, expected);
    assert.deepEqual(state.errors, [expected]);
    assert.equal(state.wizard.visible.value, true);
    assert.equal(state.wizard.objectPropertyList.value[0].apiName, "ship_name");
    assert.deepEqual(state.events, []);
    assert.equal(state.wizard.submitting.value, false);
  });
}

test("closing during a request ignores the stale result", async () => {
  let resolve;
  const state = createWizard(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const pending = state.wizard.confirmAssetCreate();
  state.wizard.visible.value = false;
  await nextTick();
  resolve({ code: 200, data: { uniqueIdentifier: "new-object" } });
  await pending;
  assert.deepEqual(state.events, []);
  assert.deepEqual(state.successes, []);
});

test("invalid space or category and missing identifier show errors without reporting success", async () => {
  let calls = 0;
  const invalidSpace = createWizard(
    async () => {
      calls++;
      return { code: 200, data: { uniqueIdentifier: "id" } };
    },
    { spaceId: "" },
  );
  await invalidSpace.wizard.confirmAssetCreate();
  assert.match(invalidSpace.wizard.error.value, /空间/);
  assert.equal(calls, 0);
  const invalidCategory = createWizard(
    async () => {
      calls++;
      return { code: 200, data: { uniqueIdentifier: "id" } };
    },
    { initialCategoryId: "invalid" },
  );
  await invalidCategory.wizard.confirmAssetCreate();
  assert.match(invalidCategory.wizard.error.value, /分类/);
  assert.equal(calls, 0);
  const missingId = createWizard(async () => ({ code: 200, data: {} }));
  await missingId.wizard.confirmAssetCreate();
  assert.match(missingId.wizard.error.value, /标识/);
  assert.equal(missingId.wizard.visible.value, true);
  assert.deepEqual(missingId.events, []);
  assert.equal(missingId.errors.length, 1);
});
