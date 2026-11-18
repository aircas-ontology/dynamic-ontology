import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { ModuleKind, transpileModule } from "typescript";
import {
  appendNewObjectProfileEntityColumns,
  collectObjectProfileEntityColumns,
  filterObjectProfileEntityRows,
  mapObjectProfileEntityRows,
  resolveObjectProfileEntityVisibleColumns,
} from "../src/views/EntityBrowsingObjectProfile/utils/mapObjectProfileEntityRows.ts";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("object profile stacks properties and entities and expands detail to whole content", () => {
  const { descriptor } = parse(readSource("../src/views/EntityBrowsingObjectProfile/index.vue"));
  const { outputText } = transpileModule(compileScript(descriptor, { id: "profile-layout" }).content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  const navigations = [];
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return Vue;
    if (id === "vue-router")
      return {
        useRoute: () => ({ params: { objectId: "obj", spaceId: "7" }, query: {} }),
        useRouter: () => ({
          push(target) {
            navigations.push(target);
          },
        }),
      };
    if (id.includes("entityBrowsingObjectProfileMock")) return { resolveEntityBrowsingObjectProfile: () => ({}) };
    return {};
  }, exports);
  const scope = Vue.effectScope();
  try {
    const page = scope.run(() => exports.default.setup({}, { expose() {} }));
    assert.equal(page.detailVisible.value, false);
    page.entityListRef.value = {
      closeEntityDetail() {
        page.handleEntityDetailVisibility(false);
        page.handleEntityDetailName("");
      },
    };
    page.handleEntityDetailName("F16-2-q");
    page.handleEntityDetailVisibility(true);
    assert.equal(page.detailEntityName.value, "F16-2-q");
    page.goBackToEntityBrowsing();
    assert.equal(page.detailVisible.value, false);
    assert.equal(page.detailEntityName.value, "");
    assert.equal(navigations.length, 0);
    page.goBackToEntityBrowsing();
    assert.equal(navigations[0].name, "EntityBrowsingObject");
    page.handleEntityDetailVisibility(true);
    assert.equal(page.detailVisible.value, true);
    page.handleEntityDetailVisibility(false);
    assert.equal(page.detailVisible.value, false);
    const template = descriptor.template.content;
    assert.doesNotMatch(template, /role="tab"|activeTab/);
    assert.ok(template.indexOf("<ObjectProfileStandardUsage") < template.indexOf("<ObjectProfileEntityList"));
    assert.match(template, /v-show="!detailVisible"/);
    assert.match(template, /@detail-visibility-change="handleEntityDetailVisibility"/);
  } finally {
    scope.stop();
  }
});

test("mapObjectProfileEntityRows flattens properties and derives dynamic columns", () => {
  const records = [
    {
      id: 1,
      entityPrimaryKey: "e-1",
      ontologyUniqueIdentifier: "obj-1",
      properties: {
        舰船名称: "卡尔·文森号",
        所属国家: "美国",
      },
    },
    {
      id: 2,
      entityPrimaryKey: "e-2",
      ontologyUniqueIdentifier: "obj-1",
      properties: {
        舰船名称: "里根号",
        在役状态: "服役中",
      },
      舷线号: "CVN-76",
    },
  ];

  const columns = collectObjectProfileEntityColumns(records);
  assert.deepEqual(columns, ["舰船名称", "所属国家", "在役状态", "舷线号"]);

  const rows = mapObjectProfileEntityRows(records);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].rowKey, "e-1");
  assert.equal(rows[0].ontologyUniqueIdentifier, "obj-1");
  assert.equal(rows[0].instanceId, "e-1");
  assert.equal(rows[0].cells["舰船名称"], "卡尔·文森号");
  assert.equal(rows[0].cells["所属国家"], "美国");
  assert.equal(rows[1].cells["舷线号"], "CVN-76");
  assert.equal(rows[1].cells["在役状态"], "服役中");
});

test("mapObjectProfileEntityRows flattens OpenAPI properties array", () => {
  const records = [
    {
      ontologyName: "阿利·伯克级驱逐舰",
      primaryKey: 1,
      displayName: "杜威号 (DDG-105)",
      properties: [
        { propertyApiName: "shipName", propertyName: "舰船名称", propertyValue: "杜威号" },
        { propertyApiName: "country", propertyName: "所属国家", propertyValue: "美国" },
        { propertyApiName: "status", propertyName: "在役状态", propertyValue: "服役中" },
      ],
    },
  ];

  const columns = collectObjectProfileEntityColumns(records);
  assert.deepEqual(columns, ["舰船名称", "所属国家", "在役状态"]);

  const rows = mapObjectProfileEntityRows(records);
  assert.equal(rows[0].cells["舰船名称"], "杜威号");
  assert.equal(rows[0].cells["所属国家"], "美国");
  assert.equal(rows[0].cells["ontologyName"], undefined);
  assert.equal(rows[0].cells["primaryKey"], undefined);
  assert.equal(rows[0].cells["displayName"], undefined);
  assert.equal(rows[0].instanceId, "1");
});

test("mapObjectProfileEntityRows prefers propertyDisplayName for column headers", () => {
  const records = [
    {
      properties: [
        { propertyApiName: "battery_life", propertyDisplayName: "续航力（千米）", propertyValue: "8000" },
        { propertyApiName: "builder", propertyDisplayName: "建造者", propertyValue: "英戈尔斯造船厂" },
      ],
    },
  ];

  const columns = collectObjectProfileEntityColumns(records);
  assert.deepEqual(columns, ["续航力（千米）", "建造者"]);

  const rows = mapObjectProfileEntityRows(records);
  assert.equal(rows[0].cells["续航力（千米）"], "8000");
  assert.equal(rows[0].cells["建造者"], "英戈尔斯造船厂");
  assert.equal(rows[0].cells["battery_life"], undefined);
});

test("resolveObjectProfileEntityVisibleColumns keeps explicit selection and appends new columns", () => {
  assert.deepEqual(resolveObjectProfileEntityVisibleColumns(["A", "B", "C"], null), ["A", "B", "C"]);
  assert.deepEqual(resolveObjectProfileEntityVisibleColumns(["A", "B", "C"], ["C", "A"]), ["A", "C"]);
  assert.deepEqual(appendNewObjectProfileEntityColumns(["A", "B", "C", "D"], ["A", "B", "C"], ["A", "C"]), ["A", "C", "D"]);
});

test("mapObjectProfileEntityRows formats null number boolean and nested values", () => {
  const rows = mapObjectProfileEntityRows([
    {
      id: 9,
      entityPrimaryKey: "e-9",
      properties: {
        空值: null,
        数量: 12,
        启用: true,
        标签: { a: 1 },
      },
    },
  ]);
  assert.equal(rows[0].cells["空值"], "");
  assert.equal(rows[0].cells["数量"], "12");
  assert.equal(rows[0].cells["启用"], "true");
  assert.equal(rows[0].cells["标签"], '{"a":1}');
});

test("filterObjectProfileEntityRows matches selected field by inclusive text", () => {
  const rows = mapObjectProfileEntityRows([
    {
      id: 1,
      entityPrimaryKey: "e-1",
      properties: { 舰船名称: "卡尔·文森号", 所属国家: "美国" },
    },
    {
      id: 2,
      entityPrimaryKey: "e-2",
      properties: { 舰船名称: "里根号", 所属国家: "美国" },
    },
  ]);

  const filtered = filterObjectProfileEntityRows(rows, "舰船名称", "里根");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].rowKey, "e-2");

  assert.equal(filterObjectProfileEntityRows(rows, "", "美国").length, 2);
  assert.equal(filterObjectProfileEntityRows(rows, "所属国家", "").length, 2);
});

test("object profile entity list tab mounts API list component", () => {
  const page = readSource("../src/views/EntityBrowsingObjectProfile/index.vue");
  const constants = readSource("../src/utils/entityBrowseConstants.ts");
  const list = readSource("../src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityList.vue");
  const composable = readSource("../src/views/EntityBrowsingObjectProfile/composables/useObjectProfileEntityList.ts");

  assert.match(page, /ObjectProfileEntityList/);
  assert.match(page, /ObjectProfileStandardUsage/);
  assert.match(page, /:space-id="spaceId"/);
  assert.doesNotMatch(page, /ObjectProfileOverview/);
  assert.doesNotMatch(page, /basic-info/);
  assert.doesNotMatch(page, /isEntityBrowsingLiteProfileObjectId/);
  assert.doesNotMatch(constants, /isEntityBrowsingLiteProfileObjectId/);
  assert.match(list, /filterable/);
  assert.match(list, /筛选字段/);
  assert.match(list, /筛选值/);
  assert.match(list, /getOntologyEntitiesInterface|useObjectProfileEntityList/);
  assert.match(list, /详情/);
  assert.match(list, /配置/);
  assert.match(list, /ObjectProfileEntityListConfigDialog/);
  assert.match(list, /openEntityDetail\(asEntityRow\(row\)\)/);
  assert.match(list, /ElMessage\.error/);
  assert.match(list, /ObjectProfileEntityDetail/);
  assert.match(list, /iframe/);
  assert.match(list, /getOntologyInstanceUrlListInterface/);
  assert.doesNotMatch(list, /function openEntityDetail\(row\?: ObjectProfileEntityRow\): void \{\s*detailEmbedded\.value = true/);
  assert.doesNotMatch(list, /配置功能待接入/);
  assert.doesNotMatch(list, /:src="ENTITY_BROWSING_ENTITY_DETAIL_URL"/);
  assert.match(composable, /getOntologyEntitiesInterface/);
  assert.match(composable, /ontologyUniqueIdentifier/);
  assert.match(composable, /visibleColumns/);
  assert.match(composable, /applyEntityListColumnConfig/);
});

test("entity list mock fixture exposes Chinese property columns", () => {
  const fixture = JSON.parse(readSource("../src/mockData/fixtures/ontology/entity/list.get.json"));
  assert.equal(fixture.code, 200);
  assert.ok(Array.isArray(fixture.data.records));
  assert.ok(fixture.data.records.length >= 2);
  const firstProps = fixture.data.records[0].properties ?? {};
  assert.ok(Object.keys(firstProps).some((key) => /[\u4e00-\u9fff]/.test(key)));
});

test("entity list rows retain original primary-key types for detail requests", () => {
  const keys = [5, 0, false, "005", { code: 5 }];
  const rows = mapObjectProfileEntityRows(keys.map((primaryKey) => ({ primaryKey, properties: { 名称: "示例" } })));
  assert.deepEqual(
    rows.map((row) => row.entityPrimaryKey),
    keys,
  );
  assert.deepEqual(
    rows.map((row) => row.instanceId),
    ["5", "0", "false", "005", '{"code":5}'],
  );
});
