import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { computed, reactive, ref } from "vue";

/**
 * @description 执行对象创建弹窗脚本，检查资产入口的真实状态变化。
 * @param {boolean} submitting 当前是否提交中。
 * @returns {object} 入口状态及操作。
 */
function createEntry(submitting) {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", import.meta.url), "utf8");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const code = ts.transpile(`${script}\nreturn { selectCreateMode, openAssetBuild, assetVisible, visible, draft, createMode };`, {
    target: ts.ScriptTarget.ES2022,
  });
  const deps = {
    computed,
    reactive,
    ref,
    watch: () => {},
    defineModel: () => ref(true),
    defineProps: () => ({ spaceId: "1", categoryTree: [], parentOptions: [], submitting, error: "" }),
    defineEmits: () => () => {},
    ontologyImportTemplate: {},
    MagicStick: {},
    UploadFilled: {},
    Plus: {},
    Upload: {},
    Grid: {},
  };
  return new Function(...Object.keys(deps), code)(...Object.values(deps));
}

test("asset mode requires button action but can enter without selecting a category", () => {
  const entry = createEntry(false);
  entry.draft.categoryId = "";
  entry.selectCreateMode("asset");
  assert.equal(entry.createMode.value, "asset");
  assert.equal(entry.assetVisible.value, false);
  entry.openAssetBuild();
  assert.equal(entry.assetVisible.value, true);
  assert.equal(entry.visible.value, false);
});

test("asset entry remains blocked while another create operation is submitting", () => {
  const entry = createEntry(true);
  entry.openAssetBuild();
  assert.equal(entry.assetVisible.value, false);
  assert.equal(entry.visible.value, true);
});
