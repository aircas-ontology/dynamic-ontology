import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import * as Vue from "vue";
import { ModuleKind, transpileModule } from "typescript";
import { enrichEntityRelationCategories, buildInstanceRelationCategoryTree } from "../src/views/EntityBrowsingObjectProfile/utils/entityRelationCategories.ts";
import { filterEntityRelations } from "../src/views/EntityBrowsingObjectProfile/utils/entityDetailCategories.ts";
const catalog = {
  categoryId: 0,
  name: "全部关系",
  children: [
    {
      categoryId: 1,
      name: "作战",
      children: [
        {
          categoryId: 2,
          name: "装备",
          links: [
            {
              uniqueIdentifier: "carry",
              name: "搭载",
              apiName: "carry_api",
              categoryId: 2,
              ontologyUniqueIdentifierFrom: "aircraft",
              ontologyUniqueIdentifierTo: "weapon",
              description: "装备挂载",
            },
          ],
        },
      ],
    },
    { categoryId: 3, name: "无关分类" },
  ],
};
const relation = {
  id: "instance-link",
  displayName: "搭载",
  categoryId: "POSSESSION",
  categoryName: "POSSESSION",
  sourceOntologyId: "aircraft",
  targetOntologyId: "weapon",
};
test("instance relation categories use management taxonomy rather than semantic linkType, retain ancestors and filter descendants", () => {
  const rows = enrichEntityRelationCategories([relation], catalog);
  assert.equal(rows[0].categoryId, "2");
  assert.equal(rows[0].categoryName, "装备");
  assert.equal(rows[0].apiName, "carry_api");
  assert.equal(rows[0].description, "装备挂载");
  const tree = buildInstanceRelationCategoryTree(rows, catalog);
  assert.equal(tree[0].children.length, 1);
  assert.equal(tree[0].children[0].label, "作战");
  assert.equal(tree[0].children[0].children[0].label, "装备");
  assert.deepEqual(filterEntityRelations(rows, "1", tree), rows);
});
test("unknown, wrong-direction and ambiguous names remain unclassified without guessing by relation type", () => {
  for (const row of [
    { ...relation, displayName: "未知" },
    { ...relation, sourceOntologyId: "weapon", targetOntologyId: "aircraft" },
  ]) {
    const rows = enrichEntityRelationCategories([row], catalog);
    assert.equal(rows[0].categoryId, "");
    assert.equal(rows[0].categoryName, "未分类");
    assert.equal(buildInstanceRelationCategoryTree(rows, catalog)[0].children[0].id, "__uncategorized__");
  }
  const duplicated = structuredClone(catalog);
  duplicated.children.push({ categoryId: 4, name: "重复", links: [{ ...catalog.children[0].children[0].links[0], uniqueIdentifier: "other", categoryId: 4 }] });
  assert.equal(enrichEntityRelationCategories([relation], duplicated)[0].categoryId, "");
  assert.equal(enrichEntityRelationCategories([{ ...relation, displayName: "carry_api" }], catalog)[0].categoryId, "2");
});

test("relation taxonomy queries deduplicate, reject stale updates and offer retry without overwriting newer space data", async () => {
  const source = readFileSync(new URL("../src/views/EntityBrowsingObjectProfile/composables/useEntityRelationCategories.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const pending = [],
    exports = {};
  new Function("require", "exports", outputText)(
    (id) => (id === "vue" ? Vue : { getOntologyRelationCategoryTreeInterface: (params) => new Promise((resolve) => pending.push({ params, resolve })) }),
    exports,
  );
  const space = Vue.ref("156"),
    scope = Vue.effectScope();
  const state = scope.run(() => exports.useEntityRelationCategories(() => space.value));
  try {
    await state.fetchRelationCategories();
    assert.equal(pending.length, 1);
    space.value = "157";
    await Vue.nextTick();
    assert.deepEqual(pending[1].params, { spaceId: "157" });
    pending[1].resolve({ code: 200, data: catalog });
    await new Promise((resolve) => setImmediate(resolve));
    pending[0].resolve({ code: 500, message: "过期失败" });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(state.status.value, "ready");
    assert.equal(state.items.value.name, "全部关系");
    const failure = state.fetchRelationCategories();
    pending[2].resolve({ code: 500, message: "分类失败" });
    await failure;
    assert.equal(state.error.value, "分类失败");
    const retry = state.fetchRelationCategories();
    pending[3].resolve({ code: 200, data: { categoryId: 0, name: "全部关系", children: [] } });
    await retry;
    assert.equal(state.status.value, "empty");
    const last = state.fetchRelationCategories();
    scope.stop();
    pending[4].resolve({ code: 200, data: catalog });
    await last;
    assert.equal(state.items.value, undefined);
  } finally {
    scope.stop();
  }
});
