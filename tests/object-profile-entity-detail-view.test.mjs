import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { ModuleKind, transpileModule } from "typescript";
import { renderToString } from "@vue/server-renderer";
import { readObjectProfileEntityPrimaryKey } from "../src/views/EntityBrowsingObjectProfile/utils/mapObjectProfileEntityRows.ts";
import { createObjectProfileEntityRelationsMock } from "../src/mocks/objectProfileEntityDetailMock/objectProfileEntityDetailMock.ts";
import { buildEntityPropertyRows, buildEntityPropertyTable, groupEntityPropertyRows } from "../src/views/EntityBrowsingObjectProfile/utils/entityDetailData.ts";

/** @description 编译真实组件并只替换依赖边界。 @param {string} name 组件名称。 @param {Function} resolve 模块解析器。 @param {boolean} inlineTemplate 是否编译模板。 @returns {object} Vue 组件。 */
function compileProfileComponent(name, resolve, inlineTemplate = false) {
  const { descriptor } = parse(readFileSync(new URL(`../src/views/EntityBrowsingObjectProfile/components/${name}.vue`, import.meta.url), "utf8"));
  const { outputText } = transpileModule(compileScript(descriptor, { id: name, inlineTemplate }).content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)(resolve, exports);
  return exports.default;
}

test("native entity detail opens selected identity and returning preserves list page and filters", () => {
  const rows = Vue.ref([
    { rowKey: "row", ontologyUniqueIdentifier: "object-a", instanceId: "0", entityPrimaryKey: 0, cells: { 名称: "实体甲" }, detailItems: [] },
  ]);
  const pageNum = Vue.ref(3),
    filterValue = Vue.ref("甲"),
    events = [];
  const scope = Vue.effectScope();
  const component = compileProfileComponent("ObjectProfileEntityList", (id) => {
    if (id === "vue") return Vue;
    if (id.includes("useObjectProfileEntityList"))
      return { useObjectProfileEntityList: () => ({ filteredRows: rows, pageNum, filterValue, status: Vue.ref("ready") }) };
    if (id.includes("mapObjectProfileEntityRows")) return { readObjectProfileEntityPrimaryKey };
    if (id === "element-plus") return { ElMessage: { error: (message) => events.push(message) } };
    return {};
  });
  const props = Vue.reactive({ objectId: "object-a", spaceId: "156", autoOpenDetail: false });
  try {
    const page = scope.run(() => component.setup(props, { expose() {}, emit: (...args) => events.push(args) }));
    assert.equal(page.openEntityDetail(rows.value[0]), true);
    assert.equal(page.selectedEntity.value.instanceId, "0");
    assert.equal(page.selectedEntity.value.entityPrimaryKey, 0);
    assert.equal(page.resolveEntityTitle(page.selectedEntity.value), "实体甲");
    page.closeEntityDetail();
    assert.equal(page.selectedEntity.value, null);
    assert.equal(pageNum.value, 3);
    assert.equal(filterValue.value, "甲");
    assert.equal(page.openEntityDetail({ ...rows.value[0], instanceId: "" }), false);
    assert.match(events.at(-1), /主键/);
  } finally {
    scope.stop();
  }
});

test("entity detail template renders the three upper panels and object behavior boundary", async () => {
  const boundaries = [];
  const empty = Vue.defineComponent({ render: () => null });
  const slot = Vue.defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        Vue.h("div", slots.default?.()),
  });
  const graph = Vue.defineComponent({
    props: { items: Array, seedNames: Array, readonly: Boolean, emptyDescription: String },
    setup: (props) => {
      boundaries.push(props);
      return () => Vue.h("div", props.emptyDescription);
    },
  });
  const behavior = Vue.defineComponent({
    props: ["items"],
    setup: (props) => {
      boundaries.push(props);
      return () => Vue.h("div", "对象行为");
    },
  });
  const state = {
    displayProperties: Vue.ref([]),
    usingListProperties: Vue.ref(false),
    categories: Vue.ref([]),
    behaviors: Vue.ref([{ id: 1 }]),
    selectedCategoryId: Vue.ref("all"),
    filteredProperties: Vue.ref([]),
    propertyStatus: Vue.ref("empty"),
    categoryStatus: Vue.ref("empty"),
    behaviorStatus: Vue.ref("ready"),
    propertyError: Vue.ref(""),
    categoryError: Vue.ref(""),
    behaviorError: Vue.ref(""),
    behaviorPage: Vue.ref(1),
    behaviorPageSize: 8,
    behaviorTotal: Vue.ref(1),
    loadEntityProperties() {},
    loadPropertyCategories() {},
    loadEntityBehaviors() {},
  };
  const component = compileProfileComponent(
    "ObjectProfileEntityDetail",
    (id) => {
      if (id === "vue") return Vue;
      if (id.includes("entityDetailData")) return { buildEntityPropertyTable, groupEntityPropertyRows };
      if (id.includes("objectProfileEntityDetailMock")) return { createObjectProfileEntityRelationsMock };
      if (id.includes("useObjectProfileEntityDetail")) return { useObjectProfileEntityDetail: () => state };
      if (id.includes("OntologyRelationGraph2d")) return { __esModule: true, default: graph };
      if (id.includes("ObjectProfileEntityBehaviors")) return { __esModule: true, default: behavior };
      return { __esModule: true, default: empty };
    },
    true,
  );
  const app = Vue.createSSRApp(component, { objectId: "object-a", instanceId: "0", spaceId: "156", entityName: "实体甲", relations: [] });
  for (const name of ["el-button", "el-input", "el-empty", "el-tree", "el-table", "el-table-column", "el-tag", "el-alert"]) app.component(name, slot);
  const html = await renderToString(app);
  assert.match(html, /属性分类树/);
  assert.match(html, /实体属性和值/);
  assert.match(html, /实体关系图/);
  assert.match(html, /对象行为/);
  assert.match(html, /返回实体列表/);
  assert.equal(boundaries[0].readonly, true);
  assert.deepEqual(boundaries[0].seedNames, ["实体甲"]);
  assert.deepEqual(boundaries[1].items, [{ id: 1 }]);
  state.propertyStatus.value = "ready";
  state.filteredProperties.value = buildEntityPropertyRows({
    propertyGroups: [
      { storageGroup: "main", groupDataList: [{ dataPrimaryKey: 5, props: [{ propertyDisplayName: "是否隐身", propertyValue: false }] }] },
      {
        storageGroup: "weapon",
        groupDataList: [
          { dataPrimaryKey: 11, props: [{ propertyDisplayName: "武器名称", propertyValue: "SCAL" }] },
          { dataPrimaryKey: 12, props: [{ propertyDisplayName: "挂载数量", propertyValue: 0 }] },
        ],
      },
    ],
  });
  const populatedApp = Vue.createSSRApp(component, { objectId: "object-a", instanceId: "0", spaceId: "156", entityName: "实体甲", relations: [] });
  for (const name of ["el-button", "el-input", "el-empty", "el-tree", "el-tag", "el-alert"]) populatedApp.component(name, slot);
  populatedApp.component(
    "el-table",
    Vue.defineComponent({
      props: ["data"],
      setup: (props, { slots }) => {
        Vue.provide("tableRows", props.data);
        return () => Vue.h("table", slots.default?.());
      },
    }),
  );
  populatedApp.component(
    "el-table-column",
    Vue.defineComponent({
      props: ["prop", "label"],
      setup: (props, { slots }) => {
        const rows = Vue.inject("tableRows");
        return () => Vue.h("tbody", [Vue.h("th", props.label), ...rows.map((row) => Vue.h("td", slots.default ? slots.default({ row }) : row[props.prop]))]);
      },
    }),
  );
  const populated = await renderToString(populatedApp);
  assert.match(populated, /<dl[\s>]/);
  assert.match(populated, /<dt[^>]*>是否隐身<\/dt>/);
  assert.match(populated, /<dd[^>]*>false<\/dd>/);
  assert.match(populated, /<span[^>]*>0<\/span>/);
  assert.match(populated, /weapon/);
  assert.match(populated, /<td>11<\/td>/);
  assert.match(populated, /<td>12<\/td>/);
  assert.match(populated, /<th>武器名称<\/th>/);
  assert.match(populated, /<span[^>]*>—<\/span>/);
  assert.equal((populated.match(/<table/g) ?? []).length, 1);
  assert.equal((populated.match(/<dl[\s>]/g) ?? []).length, 1);
});

test("detail preserves primary-key identity and uses relation examples only when no explicit data is supplied", () => {
  const scope = Vue.effectScope();
  let currentIdentity;
  const component = compileProfileComponent("ObjectProfileEntityDetail", (id) => {
    if (id === "vue") return Vue;
    if (id.includes("entityDetailData")) return { buildEntityPropertyTable, groupEntityPropertyRows };
    if (id.includes("objectProfileEntityDetailMock")) return { createObjectProfileEntityRelationsMock };
    if (id.includes("useObjectProfileEntityDetail"))
      return {
        useObjectProfileEntityDetail: (identity) => {
          currentIdentity = identity;
          return { displayProperties: Vue.ref([]), categories: Vue.ref([]) };
        },
      };
    return {};
  });
  const props = Vue.reactive({
    objectId: "aircraft",
    instanceId: "5",
    entityPrimaryKey: 5,
    spaceId: "156",
    entityName: "阵风F4",
    listProperties: [{ label: "名称", value: "阵风F4" }],
    relations: undefined,
  });
  try {
    const page = scope.run(() => component.setup(props, { expose() {}, emit() {} }));
    assert.equal(currentIdentity.value.entityPrimaryKey, 5);
    assert.deepEqual(currentIdentity.value.listProperties, props.listProperties);
    assert.equal(page.usingRelationsMock.value, true);
    assert.ok(page.resolvedRelations.value.every((item) => item.sourceName === "阵风F4"));
    props.entityName = "实体乙";
    assert.ok(page.resolvedRelations.value.every((item) => item.sourceName === "实体乙"));
    props.relations = [];
    assert.equal(page.usingRelationsMock.value, false);
    assert.deepEqual(page.resolvedRelations.value, []);
    props.relations = [{ id: "real-relation" }];
    assert.deepEqual(page.resolvedRelations.value, [{ id: "real-relation" }]);
  } finally {
    scope.stop();
  }
});
