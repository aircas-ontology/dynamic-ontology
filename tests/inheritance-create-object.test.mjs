import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { computed, reactive, ref, watch, nextTick, effectScope } from "vue";

test("inheritance node add emits the matching object without selecting it", () => {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/ConceptHierarchyTree.vue", import.meta.url), "utf8");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const item = { id: "ship", categoryId: "7" };
  const events = [];
  const deps = {
    computed,
    ref,
    defineProps: () => ({ objects: [item], tree: [], spaceName: "空间" }),
    defineEmits:
      () =>
      (...args) =>
        events.push(args),
  };
  const state = new Function(...Object.keys(deps), ts.transpile(`${script}\nreturn { openInheritedObjectDialog };`, { target: ts.ScriptTarget.ES2022 }))(
    ...Object.values(deps),
  );
  state.openInheritedObjectDialog({ objectId: "ship" });
  assert.deepEqual(events, [["createInherited", item]]);
  state.openInheritedObjectDialog({ objectId: "missing" });
  assert.equal(events.length, 1);
});

/** @description 执行真实对象操作逻辑并隔离未调用的接口依赖。 @returns {object} 操作状态。 */
function createActions() {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts", import.meta.url), "utf8");
  const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  const exports = {};
  new Function("exports", "require", code)(exports, (name) => (name === "vue" ? { computed, ref } : { collectCategoryOptions: () => [] }));
  return exports.useObjectWorkspaceObjectActions({ spaceId: ref("1"), workspace: ref({ tree: [], sections: [] }), load: async () => {} });
}

test("inherited creation preserves parent missing from list and clears it for ordinary create and edit", () => {
  const state = createActions();
  const parent = { id: "ship", displayName: "船", apiName: "ship", categoryId: "7" };
  state.openInheritedOntologyObjectCreateDialog(parent);
  assert.equal(state.objectCreateVisible.value, true);
  assert.equal(state.initialParentId.value, "ship");
  assert.equal(state.parentOptions.value[0].id, "ship");
  state.openOntologyObjectCreateDialog();
  assert.equal(state.initialParentId.value, undefined);
  state.openInheritedOntologyObjectCreateDialog(parent);
  state.openOntologyObjectEditDialog(parent);
  assert.equal(state.initialParentId.value, undefined);
});

test("dialog opens manually with inherited category and resets on ordinary reopen or edit", async () => {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", import.meta.url), "utf8");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const props = reactive({
    categoryTree: [{ id: "3", label: "默认", children: [] }],
    parentOptions: [{ id: "ship", categoryId: "7" }],
    initialParentId: "ship",
  });
  const visible = ref(false);
  const deps = {
    computed,
    reactive,
    ref,
    watch,
    defineProps: () => props,
    defineModel: () => visible,
    defineEmits: () => () => {},
    ontologyImportTemplate: {},
    MagicStick: {},
    UploadFilled: {},
    Plus: {},
    Upload: {},
    Grid: {},
  };
  const scope = effectScope();
  try {
    const state = scope.run(() =>
      new Function(...Object.keys(deps), ts.transpile(`${script}\nreturn { draft, createMode };`, { target: ts.ScriptTarget.ES2022 }))(...Object.values(deps)),
    );
    visible.value = true;
    await nextTick();
    assert.equal(state.createMode.value, "manual");
    assert.equal(state.draft.parentId, "ship");
    assert.equal(state.draft.categoryId, "7");
    visible.value = false;
    await nextTick();
    props.initialParentId = undefined;
    visible.value = true;
    await nextTick();
    assert.equal(state.draft.parentId, undefined);
    assert.equal(state.draft.categoryId, "3");
    props.initialParentId = "ship";
    props.editingItem = { categoryId: "9", displayName: "编辑" };
    await nextTick();
    assert.equal(state.draft.parentId, undefined);
    assert.equal(state.draft.categoryId, "9");
  } finally {
    scope.stop();
  }
});
