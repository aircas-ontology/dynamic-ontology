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
  const code = ts.transpile(
    `${script}\nreturn { selectCreateMode, openAssetBuild, openDatasourceBuild, handleDatasourceSubmit, datasourceVisible, categoryError, assetVisible, visible, draft, createMode, emitted };`,
    {
      target: ts.ScriptTarget.ES2022,
    },
  );
  const deps = {
    emitted: [],
    computed,
    reactive,
    ref,
    watch: () => {},
    defineModel: () => ref(true),
    defineProps: () => ({ spaceId: "1", categoryTree: [{ id: "3", label: "分类", children: [] }], parentOptions: [], submitting, error: "" }),
    defineEmits:
      () =>
      (...args) =>
        deps.emitted.push(args),
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

test("datasource entry opens without external category and uses wizard object information", () => {
  const entry = createEntry(false);
  entry.selectCreateMode("datasource");
  entry.draft.categoryId = "";
  entry.openDatasourceBuild();
  assert.equal(entry.datasourceVisible.value, true);
  assert.equal(entry.categoryError.value, "");
  entry.handleDatasourceSubmit({ primaryTableId: "ships", selectedTables: [] }, { displayName: "舰船", categoryId: "3" });
  assert.equal(entry.emitted.at(-1)[0], "submit-datasource");
  assert.equal(entry.emitted.at(-1)[2].categoryId, "3");
  assert.equal(entry.emitted.at(-1)[2].displayName, "舰船");
  assert.equal(entry.emitted.at(-1)[2].apiName, "ships");
});

test("datasource entry is blocked during submission", () => {
  const entry = createEntry(true);
  entry.draft.categoryId = "3";
  entry.openDatasourceBuild();
  assert.equal(entry.datasourceVisible.value, false);
});

test("asset entry remains blocked while another create operation is submitting", () => {
  const entry = createEntry(true);
  entry.openAssetBuild();
  assert.equal(entry.assetVisible.value, false);
  assert.equal(entry.visible.value, true);
});
