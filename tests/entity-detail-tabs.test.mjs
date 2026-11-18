import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import * as Vue from "vue";
import { ModuleKind, transpileModule } from "typescript";
import { filterEntityRelations, mapEntityBehaviorCategories } from "../src/views/EntityBrowsingObjectProfile/utils/entityDetailCategories.ts";

const relations = [
  { id: "a", categoryId: "deploy", categoryName: "部署" },
  { id: "b", categoryId: "carry", categoryName: "搭载" },
  { id: "c", categoryId: "deploy", categoryName: "部署" },
  { id: "d", categoryId: "", categoryName: "" },
];
test("relation filtering preserves current entity records and handles all, unclassified and missing categories", () => {
  assert.deepEqual(
    filterEntityRelations(relations, "deploy").map((item) => item.id),
    ["a", "c"],
  );
  assert.deepEqual(filterEntityRelations(relations, "all"), relations);
  assert.deepEqual(
    filterEntityRelations(relations, "__uncategorized__").map((item) => item.id),
    ["d"],
  );
  assert.deepEqual(filterEntityRelations(relations, "missing"), []);
});
test("behavior category mapping preserves nested names, legacy items and root semantics without management leaves", () => {
  const tree = mapEntityBehaviorCategories({
    id: 0,
    name: "行为",
    children: [{ categoryId: 2, categoryName: "飞行", items: { id: 3, name: "起降", actionInfos: [{ actionApi: "takeoff" }] } }],
  });
  assert.equal(tree[0].id, "all");
  assert.equal(tree[0].children[0].id, "2");
  assert.equal(tree[0].children[0].children[0].label, "起降");
  assert.equal(tree[0].children[0].children[0].children.length, 0);
  assert.deepEqual(mapEntityBehaviorCategories([])[0].children, []);
  assert.throws(() => mapEntityBehaviorCategories([{ name: "invalid" }]), /分类/);
});

/** @description 使用真实响应式隔离分类 HTTP 边界。 @param {Function} request 分类请求。 @param {string} initial 初始空间。 @returns {object} 分类控制器。 */
function createCategoryHarness(request, initial = "156") {
  const source = readFileSync(new URL("../src/views/EntityBrowsingObjectProfile/composables/useEntityBehaviorCategories.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return Vue;
    if (id === "@/apis") return { getActionCategoryTreeInterface: request };
    return { mapEntityBehaviorCategories };
  }, exports);
  const space = Vue.ref(initial);
  const scope = Vue.effectScope();
  return { space, scope, state: scope.run(() => exports.useEntityBehaviorCategories(() => space.value)) };
}

/** @description 结算分类异步请求和侦听器。 @returns {Promise<void>} 完成信号。 */
async function settleCategories() {
  await new Promise((resolve) => setImmediate(resolve));
  await Vue.nextTick();
}

test("category requests deduplicate, ignore stale responses and stop updates after disposal", async () => {
  const pending = [];
  const h = createCategoryHarness((params) => new Promise((resolve) => pending.push({ params, resolve })));
  await h.state.fetchBehaviorCategories();
  assert.equal(pending.length, 1);
  h.space.value = "157";
  await settleCategories();
  assert.equal(pending[1].params.spaceId, 157);
  pending[1].resolve({ code: 200, data: [{ id: 1, name: "root", children: [{ id: 2, name: "新分类" }] }] });
  await settleCategories();
  pending[0].resolve({ code: 500, message: "过期错误" });
  await settleCategories();
  assert.equal(h.state.status.value, "ready");
  assert.equal(h.state.items.value[0].children[0].label, "新分类");
  h.space.value = "158";
  await settleCategories();
  h.scope.stop();
  pending[2].resolve({ code: 200, data: [] });
  await settleCategories();
  assert.equal(h.state.status.value, "loading");
});

test("category failures are retryable and empty or invalid spaces have explicit states", async () => {
  let response = { code: 500, message: "分类失败" };
  const h = createCategoryHarness(async () => response);
  await settleCategories();
  assert.equal(h.state.error.value, "分类失败");
  response = { code: 200, data: [] };
  await h.state.fetchBehaviorCategories();
  assert.equal(h.state.status.value, "empty");
  h.space.value = "";
  await settleCategories();
  assert.equal(h.state.status.value, "error");
  assert.match(h.state.error.value, /空间/);
  h.scope.stop();
});
