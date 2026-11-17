import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { ModuleKind, transpileModule } from "typescript";
import {
  buildEntityListPropertyRows,
  groupEntityPropertyRows,
  buildEntityPropertyTable,
  buildEntityPropertyRows,
  buildEntityCategoryTree,
  filterEntityPropertyRows,
  parseEntityPrimaryKey,
} from "../src/views/EntityBrowsingObjectProfile/utils/entityDetailData.ts";

const categories = { categoryId: 1, name: "全部", children: [{ categoryId: 2, name: "基本属性", children: [{ categoryId: 3, name: "状态" }] }] };
const detail = {
  propertyGroups: [
    {
      storageGroup: "main",
      groupDataList: [
        {
          dataPrimaryKey: 0,
          props: [
            { propertyUniqIdentifier: "p", propertyApiName: "enabled", propertyDisplayName: "启用", propertyValue: false, categoryId: 3 },
            { propertyUniqIdentifier: "n", propertyApiName: "count", propertyDisplayName: "数量", propertyValue: 0, categoryId: 2 },
            { propertyUniqIdentifier: "z", propertyApiName: "missing", propertyValue: null },
          ],
        },
      ],
    },
    {
      storageGroup: "history",
      groupDataList: [{ dataPrimaryKey: 1, props: [{ propertyUniqIdentifier: "p", propertyApiName: "enabled", propertyValue: true, categoryId: 3 }] }],
    },
  ],
};

test("subtable pivots records into property columns without losing repeated values or missing cells", () => {
  const rows = buildEntityPropertyRows({
    propertyGroups: [
      {
        storageGroup: "weapon",
        groupDataList: [
          {
            dataPrimaryKey: 0,
            props: [
              { propertyUniqIdentifier: "name", propertyDisplayName: "名称", propertyValue: "SCAL" },
              { propertyUniqIdentifier: "count", propertyDisplayName: "数量", propertyValue: 0 },
              { propertyUniqIdentifier: "count", propertyDisplayName: "数量", propertyValue: false },
            ],
          },
          { dataPrimaryKey: 12, props: [{ propertyUniqIdentifier: "other", propertyDisplayName: "名称", propertyValue: "other" }] },
        ],
      },
    ],
  });
  const table = buildEntityPropertyTable(groupEntityPropertyRows(rows)[0].records);
  assert.deepEqual(
    table.columns.map((column) => column.label),
    ["名称", "数量", "名称"],
  );
  assert.equal(table.rows.length, 2);
  assert.equal(table.rows[0].dataPrimaryKey, "0");
  assert.deepEqual(table.rows[0].cells, ["SCAL", "0\nfalse", "—"]);
  assert.deepEqual(table.rows[1].cells, ["—", "—", "other"]);
  assert.deepEqual(buildEntityPropertyTable([]), { columns: [], rows: [] });
  assert.equal(buildEntityPropertyTable(groupEntityPropertyRows(rows.slice(0, 1))[0].records).columns.length, 1);
});

test("property key-value groups keep storage groups and individual records separate after filtering", () => {
  const source = {
    propertyGroups: [
      ...detail.propertyGroups,
      {
        storageGroup: "history",
        groupDataList: [
          {
            props: [
              { propertyApiName: "name", propertyValue: "first" },
              { propertyApiName: "name", propertyValue: "duplicate" },
            ],
          },
          { props: [{ propertyApiName: "name", propertyValue: "second" }] },
        ],
      },
    ],
  };
  const rows = buildEntityPropertyRows(source);
  const groups = groupEntityPropertyRows(rows);
  assert.deepEqual(
    groups.map((group) => group.name),
    ["main", "history"],
  );
  assert.equal(groups[0].records.length, 1);
  assert.deepEqual(
    groups[0].records[0].properties.map((row) => row.value),
    ["false", "0", "—"],
  );
  assert.equal(groups[1].records.length, 3);
  assert.deepEqual(
    groups[1].records[1].properties.map((row) => row.value),
    ["first", "duplicate"],
  );
  assert.deepEqual(
    groups[1].records[2].properties.map((row) => row.value),
    ["second"],
  );
  const filtered = groupEntityPropertyRows(filterEntityPropertyRows(rows, buildEntityCategoryTree(categories), "3"));
  assert.deepEqual(
    filtered.map((group) => group.records.length),
    [1, 1],
  );
  assert.deepEqual(groupEntityPropertyRows([]), []);
  const fallback = groupEntityPropertyRows(buildEntityListPropertyRows([{ label: "数量", value: "0" }], []));
  assert.equal(fallback[0].records[0].properties[0].value, "0");
});

test("entity properties preserve false, zero, grouped records and category descendant filters", () => {
  const rows = buildEntityPropertyRows(detail);
  assert.equal(rows.length, 4);
  assert.equal(new Set(rows.map((row) => row.id)).size, 4);
  assert.deepEqual(
    rows.map((row) => row.value),
    ["false", "0", "—", "true"],
  );
  const tree = buildEntityCategoryTree(categories);
  assert.equal(filterEntityPropertyRows(rows, tree, "2").length, 3);
  assert.equal(filterEntityPropertyRows(rows, tree, "3").length, 2);
  assert.equal(filterEntityPropertyRows(rows, tree, "all").length, 4);
  assert.equal(filterEntityPropertyRows(rows, tree, "unknown").length, 0);
  assert.deepEqual(buildEntityPropertyRows(null), []);
  assert.deepEqual(buildEntityCategoryTree(null), []);
  assert.equal(rows[3].storageGroup, "history");
});

test("entity primary keys retain string semantics and parse composite keys safely", () => {
  assert.equal(parseEntityPrimaryKey("001"), "001");
  assert.equal(parseEntityPrimaryKey("0"), "0");
  assert.deepEqual(parseEntityPrimaryKey('{"id":2}'), { id: 2 });
  assert.throws(() => parseEntityPrimaryKey(""), /主键/);
  assert.throws(() => parseEntityPrimaryKey("{broken}"), /主键/);
  assert.equal(
    buildEntityPropertyRows({
      propertyGroups: [{ storageGroup: "main", groupDataList: [{ props: [{ propertyValue: { a: 1 }, propertyApiName: "data" }] }] }],
    })[0].value,
    '{"a":1}',
  );
});

/** @description 使用真实 Vue 响应式与真实业务映射，隔离 HTTP 边界。 @param {object} apis HTTP 替身。 @returns {object} 数据控制器。 */
function createDetailHarness(apis = {}) {
  const requests = [];
  const properties = async (params) => {
    requests.push(["properties", params]);
    return { code: 200, data: detail };
  };
  const category = async (params) => {
    requests.push(["categories", params]);
    return { code: 200, data: categories };
  };
  const behaviors = async (params) => {
    requests.push(["behaviors", params]);
    return { code: 200, data: { records: [{ id: 1, displayName: "当前行为" }], total: 25 } };
  };
  const source = readFileSync(new URL("../src/views/EntityBrowsingObjectProfile/composables/useObjectProfileEntityDetail.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return Vue;
    if (id === "@/apis")
      return {
        postGetOntologyEntityRowDetailInterface: properties,
        getOntologyObjectArrTypeTreeInterface: category,
        getListOntologyActionInterface: behaviors,
        ...apis,
      };
    if (id.includes("entityDetailData"))
      return { buildEntityPropertyRows, buildEntityCategoryTree, filterEntityPropertyRows, parseEntityPrimaryKey, buildEntityListPropertyRows };
    throw new Error(id);
  }, exports);
  const identity = Vue.ref({ objectId: "object-a", instanceId: "0", spaceId: "156" });
  const scope = Vue.effectScope();
  const state = scope.run(() => exports.useObjectProfileEntityDetail(identity));
  return { identity, scope, state, requests };
}

/** @description 等待请求和 Vue 侦听器结算。 @returns {Promise<void>} 等待完成。 */
async function settleDetailRequests() {
  for (let index = 0; index < 8; index += 1) await Vue.nextTick();
}

test("detail queries selected entity and object-scoped behaviors, supports categories and pagination", async () => {
  const h = createDetailHarness();
  try {
    await settleDetailRequests();
    assert.equal(h.state.propertyStatus.value, "ready");
    assert.equal(h.state.behaviorStatus.value, "ready");
    assert.deepEqual(h.requests.find(([kind]) => kind === "properties")[1], { ontologyUniqueIdentifier: "object-a", entityPrimaryKey: "0", sort: "DESC" });
    const params = h.requests.find(([kind]) => kind === "behaviors")[1];
    assert.equal(params.ontologyId, "object-a");
    assert.equal(params.ontologySpaceId, 156);
    h.state.selectedCategoryId.value = "3";
    assert.equal(h.state.filteredProperties.value.length, 2);
    await h.state.loadEntityBehaviors(2);
    assert.equal(h.state.behaviorPage.value, 2);
    assert.equal(h.state.behaviorTotal.value, 25);
  } finally {
    h.scope.stop();
  }
});

test("property failures are independent from behavior data and can retry", async () => {
  let fail = true;
  const h = createDetailHarness({
    postGetOntologyEntityRowDetailInterface: async () => {
      if (fail) throw new Error("属性失败");
      return { code: 200, data: null };
    },
  });
  try {
    await settleDetailRequests();
    assert.equal(h.state.propertyStatus.value, "error");
    assert.match(h.state.propertyError.value, /属性失败/);
    assert.equal(h.state.behaviorStatus.value, "ready");
    fail = false;
    await h.state.loadEntityProperties();
    assert.equal(h.state.propertyStatus.value, "empty");
  } finally {
    h.scope.stop();
  }
});

test("identity changes discard old responses, repeated loads coalesce, disposal blocks late updates", async () => {
  const pending = [];
  const h = createDetailHarness({ postGetOntologyEntityRowDetailInterface: (params) => new Promise((resolve) => pending.push({ params, resolve })) });
  await settleDetailRequests();
  void h.state.loadEntityProperties();
  assert.equal(pending.length, 1);
  h.identity.value = { ...h.identity.value, objectId: "object-b" };
  await settleDetailRequests();
  assert.equal(pending.length, 2);
  pending[1].resolve({ code: 200, data: null });
  await settleDetailRequests();
  pending[0].resolve({ code: 200, data: detail });
  await settleDetailRequests();
  assert.equal(h.state.propertyStatus.value, "empty");
  void h.state.loadEntityProperties();
  h.scope.stop();
  pending[2].resolve({ code: 200, data: detail });
  await settleDetailRequests();
  assert.equal(h.state.properties.value.length, 0);
});

test("category filtering uses tree property membership when detail omits categoryId", () => {
  const tree = buildEntityCategoryTree({ categoryId: 2, name: "基本属性", propertyInfos: [{ uniqueIdentifier: "p" }] });
  const rows = buildEntityPropertyRows({
    propertyGroups: [{ storageGroup: "main", groupDataList: [{ props: [{ propertyUniqIdentifier: "p", propertyValue: 0 }] }] }],
  });
  assert.equal(filterEntityPropertyRows(rows, tree, "2").length, 1);
});

test("empty, invalid identity, category failures and behavior failures expose independent states", async () => {
  const h = createDetailHarness({
    getOntologyObjectArrTypeTreeInterface: async () => ({ code: 500, message: "分类失败" }),
    getListOntologyActionInterface: async () => ({ code: 500, message: "行为失败" }),
  });
  try {
    await settleDetailRequests();
    assert.equal(h.state.categoryStatus.value, "error");
    assert.match(h.state.categoryError.value, /分类失败/);
    assert.equal(h.state.behaviorStatus.value, "error");
    assert.match(h.state.behaviorError.value, /行为失败/);
    assert.equal(h.state.propertyStatus.value, "ready");
    h.identity.value = { objectId: "", instanceId: "", spaceId: "" };
    await settleDetailRequests();
    assert.equal(h.state.propertyStatus.value, "error");
    assert.equal(h.state.behaviorStatus.value, "error");
  } finally {
    h.scope.stop();
  }
});

test("new behavior pages discard older responses and handle empty results", async () => {
  const pending = [];
  const h = createDetailHarness({ getListOntologyActionInterface: (params) => new Promise((resolve) => pending.push({ params, resolve })) });
  try {
    await settleDetailRequests();
    void h.state.loadEntityBehaviors(1);
    assert.equal(pending.length, 1);
    void h.state.loadEntityBehaviors(2);
    pending[1].resolve({ code: 200, data: { records: [], total: 10 } });
    await settleDetailRequests();
    pending[0].resolve({ code: 200, data: { records: [{ id: 99 }], total: 99 } });
    await settleDetailRequests();
    assert.equal(h.state.behaviorPage.value, 2);
    assert.equal(h.state.behaviorStatus.value, "empty");
    assert.equal(h.state.behaviorTotal.value, 10);
  } finally {
    h.scope.stop();
  }
});

test("detail uses preserved numeric boolean and composite keys without converting strings", async () => {
  for (const key of [5, 0, false, "005", { code: 5 }]) {
    const h = createDetailHarness();
    try {
      await settleDetailRequests();
      h.identity.value = { ...h.identity.value, entityPrimaryKey: key };
      await settleDetailRequests();
      assert.deepEqual(h.requests.filter(([kind]) => kind === "properties").at(-1)[1].entityPrimaryKey, key);
    } finally {
      h.scope.stop();
    }
  }
});

test("failed full detail displays actual selected-list values, keeps error, filters categories and recovers on retry", async () => {
  let fail = true;
  const h = createDetailHarness({
    postGetOntologyEntityRowDetailInterface: async () => {
      if (fail) throw new Error("字段类型不一致（请求号：example）");
      return { code: 200, data: detail };
    },
    getOntologyObjectArrTypeTreeInterface: async () => ({
      code: 200,
      data: { categoryId: 1, name: "全部", children: [{ categoryId: 2, name: "基本", propertyInfos: [{ uniqueIdentifier: "name", displayName: "名称" }] }] },
    }),
  });
  try {
    h.identity.value = {
      ...h.identity.value,
      listProperties: [
        { label: "名称", value: "阵风F4" },
        { label: "数量", value: "0" },
      ],
    };
    await settleDetailRequests();
    assert.equal(h.state.propertyStatus.value, "error");
    assert.equal(h.state.usingListProperties.value, true);
    assert.deepEqual(
      h.state.filteredProperties.value.map((row) => row.value),
      ["阵风F4", "0"],
    );
    assert.match(h.state.propertyError.value, /example/);
    h.state.selectedCategoryId.value = "2";
    assert.equal(h.state.filteredProperties.value[0].name, "名称");
    assert.equal(h.state.filteredProperties.value.length, 1);
    fail = false;
    await h.state.loadEntityProperties();
    assert.equal(h.state.usingListProperties.value, false);
    assert.equal(h.state.propertyStatus.value, "ready");
    assert.equal(h.state.propertyError.value, "");
    assert.ok(h.state.filteredProperties.value.every((row) => row.value !== "阵风F4"));
  } finally {
    h.scope.stop();
  }
});
