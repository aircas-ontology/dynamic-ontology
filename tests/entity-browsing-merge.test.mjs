import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compile } from "@vue/compiler-dom";
import { parse } from "@vue/compiler-sfc";
import * as Vue from "vue";
import { renderToString } from "vue/server-renderer";
import { createMemoryHistory, createRouter } from "vue-router";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";
import {
  collectObjectProfileEntityColumns,
  filterObjectProfileEntityRows,
  mapObjectProfileEntityRows,
} from "../src/views/EntityBrowsingObjectProfile/utils/mapObjectProfileEntityRows.ts";

test("both space kinds share the browse workspace and preserve origin in nested routes", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  for (const spaceType of ["0", "1"]) {
    const query = { spaceName: "示例空间", spaceType, from: spaceType === "1" ? "theme-space-browse" : "ontology-space-browse" };
    for (const name of ["EntityBrowsingObject", "EntityBrowsingRelation", "EntityBrowsingFunctionOperator", "EntityBrowsingBehavior"]) {
      const resolved = router.resolve({ name, params: { spaceId: "1" }, query });
      assert.equal(resolved.meta.browseOnly, true);
      assert.deepEqual(resolved.query, query);
      assert.equal(resolved.params.spaceId, "1");
    }
    const profile = router.resolve({ name: "EntityBrowsingObjectProfile", params: { spaceId: "1", objectId: "abc" }, query });
    assert.deepEqual(profile.query, query);
    assert.equal(profile.meta.browseOnly, true);
  }
});

test("entity rows keep distinct keys, dynamic attributes, and filtered results", () => {
  const records = [
    { entityPrimaryKey: "one", properties: { name: "Alpha", state: "active" } },
    { entityPrimaryKey: "two", properties: { name: "Beta", state: "inactive" } },
  ];
  assert.deepEqual(collectObjectProfileEntityColumns(records), ["name", "state"]);
  const rows = mapObjectProfileEntityRows(records);
  assert.deepEqual(
    rows.map((row) => row.rowKey),
    ["one", "two"],
  );
  assert.deepEqual(
    filterObjectProfileEntityRows(rows, "name", "beta").map((row) => row.rowKey),
    ["two"],
  );
  assert.deepEqual(filterObjectProfileEntityRows(rows, "name", "missing"), []);
});

/**
 * @description 使用轻量控件呈现实际页面模板，验证浏览和管理操作差异。
 * @param {string} file 页面组件相对路径。
 * @param {object} state 页面状态。
 * @returns {Promise<string>} 页面输出。
 */
async function renderWorkspace(file, state) {
  const template = parse(readFileSync(new URL(file, import.meta.url), "utf8")).descriptor.template.content;
  const render = new Function("Vue", compile(template, { mode: "function", prefixIdentifiers: true }).code)(Vue);
  const app = Vue.createSSRApp({ render: () => render(state, []) });
  for (const name of new Set(Array.from(template.matchAll(/<([A-Za-z][\w-]*)/g), (match) => match[1]))) {
    if (!name.includes("-") && name[0] === name[0].toLowerCase()) continue;
    app.component(name, {
      setup:
        (_, { slots }) =>
        () =>
          Vue.h("div", slots.default?.({ row: state.row })),
    });
  }
  return renderToString(app);
}

for (const viewMode of ["card", "table"]) {
  test(`object ${viewMode} browsing opens detail by clicking the item and hides the detail button`, async () => {
    const row = { id: "object-1", displayName: "对象", apiName: "object", metrics: { attribute: 1, relation: 0, behavior: 0 } };
    const state = {
      browseOnly: true,
      viewMode,
      row,
      sections: [{ categoryId: "category", name: "分类", items: [row] }],
      activeCategoryId: "",
      activeObjectId: "",
      categoryAnchorId: () => "category",
      objectRow: (value) => value,
    };
    const browse = await renderWorkspace("../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue", state);
    assert.doesNotMatch(browse, /详情/);
    assert.doesNotMatch(browse, /新建对象|编辑|删除|导出/);
    const management = await renderWorkspace("../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue", { ...state, browseOnly: false });
    assert.match(management, /详情/);
    assert.match(management, /新建对象/);
    assert.match(management, /编辑/);
    assert.match(management, /删除/);
  });
}
