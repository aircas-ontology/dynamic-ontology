import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { nextTick, reactive, ref, watch } from "vue";
import * as Vue from "vue";
import { compile, baseParse } from "@vue/compiler-dom";
import { parse } from "@vue/compiler-sfc";
import { renderToString } from "@vue/server-renderer";
import {
  buildAssetPropertyDrafts,
  buildAssetModelConfiguration,
  mapAssetPropertyDataType,
} from "../src/views/ObjectWorkspacePanel/utils/buildAssetModelConfiguration.ts";
import * as configuration from "../src/views/ObjectWorkspacePanel/utils/buildAssetModelConfiguration.ts";

const property = (id, name, dataType) => ({
  id,
  name,
  shortName: "",
  apiName: id,
  description: `${name}定义`,
  dataType,
  representation: "",
  required: false,
  metaList: [],
});
const draft = { apiName: "ship", displayName: "舰船", categoryId: "1", iconUrl: "", description: "" };

test("object form puts category beside both names and omits icon and inheritance fields", () => {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/AssetModelBuildDialog.vue", import.meta.url), "utf8");
  const root = baseParse(parse(source).descriptor.template.content);
  /** @description 查找对象信息表单。 @param {object} node 模板节点。 @returns {object | undefined} 表单节点。 */
  function findObjectForm(node) {
    if (node.type === 1 && node.tag === "el-form" && node.props.some((item) => item.name === "class" && item.value?.content === "asset-build__object-form"))
      return node;
    for (const child of node.children ?? []) {
      const found = findObjectForm(child);
      if (found) return found;
    }
    return undefined;
  }
  const form = findObjectForm(root);
  assert.ok(form);
  const row = form.children.find(
    (node) => node.type === 1 && node.tag === "div" && node.props.some((item) => item.name === "class" && item.value?.content === "asset-build__form"),
  );
  const labels = row.children
    .filter((item) => item.type === 1 && item.tag === "el-form-item")
    .map((item) => item.props.find((prop) => prop.name === "label")?.value?.content);
  assert.deepEqual(labels, ["API 名称", "显示名称", "分类"]);
  assert.doesNotMatch(form.loc.source, /对象图标|继承对象/);
});

test("expanded metadata omits representation and shows empty state when no rules exist", async () => {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/AssetModelBuildDialog.vue", import.meta.url), "utf8");
  const template = parse(source).descriptor.template.content;
  const root = baseParse(template);
  /** @description 查找元数据展开列。 @param {object} node 模板节点。 @returns {object | undefined} 展开列。 */
  function findExpandColumn(node) {
    if (node.type === 1 && node.tag === "el-table-column" && node.props.some((item) => item.name === "type" && item.value?.content === "expand")) return node;
    for (const child of node.children ?? []) {
      const found = findExpandColumn(child);
      if (found) return found;
    }
    return undefined;
  }
  const column = findExpandColumn(root);
  assert.ok(column, "second step must provide a table expand column");
  /** @description 查找属性列表表格。 @param {object} node 模板节点。 @returns {object | undefined} 表格节点。 */
  function findPropertyTable(node) {
    if (
      node.type === 1 &&
      node.tag === "el-table" &&
      node.props.some((item) => item.type === 7 && item.arg?.content === "data" && item.exp?.content === "objectPropertyList")
    )
      return node;
    for (const child of node.children ?? []) {
      const found = findPropertyTable(child);
      if (found) return found;
    }
    return undefined;
  }
  const table = findPropertyTable(root);
  assert.ok(table, "second step must include the property table");
  const columns = table.children.filter((node) => node.type === 1 && node.tag === "el-table-column");
  assert.equal(columns.at(-1), column, "metadata expand column must be last");
  const render = new Function("Vue", compile(column.loc.source, { mode: "function" }).code)(Vue);
  const selected = [
    { ...property("a", "甲", "字符串型"), representation: "普通文本" },
    { ...property("b", "乙", "数值型"), representation: "数字代码" },
    property("c", "丙", "字符串型"),
    { ...property("d", "丁", "字符串型"), representation: "   " },
  ];
  const drafts = buildAssetPropertyDrafts(
    selected.map((item, index) => ({ key: String(index), property: item })),
    [],
  );
  for (const index of [0, 1, 2, 3]) {
    const row = drafts[index];
    const app = Vue.createSSRApp({ render });
    app.component("el-table-column", {
      inheritAttrs: false,
      setup(_props, { slots }) {
        return () => slots.default?.({ row });
      },
    });
    const html = await renderToString(app);
    assert.match(html, /元数据/);
    assert.ok(html.includes("暂无元数据"));
    assert.ok(!html.includes("普通文本") && !html.includes("数字代码"));
    assert.equal(row.apiName, "");
  }
});

test("asset standard types map to supported property enum values", () => {
  assert.equal(mapAssetPropertyDataType("字符串型"), "String");
  assert.equal(mapAssetPropertyDataType("数值型"), "Int");
  assert.equal(mapAssetPropertyDataType("数字型"), "Int");
  assert.equal(mapAssetPropertyDataType("日期时间型"), "Timestamp");
  assert.equal(mapAssetPropertyDataType("二进制型"), "");
  assert.equal(mapAssetPropertyDataType("其他"), "");
});

test("editable properties start blank and retain separate edits for duplicate data-element ids", () => {
  const original = [property("dup", "第一项", "数值型"), property("dup", "第二项", "字符串型")];
  const selected = original.map((item, index) => ({ key: String(index), property: item }));
  const initial = buildAssetPropertyDrafts(selected, []);
  assert.deepEqual(
    initial.map((item) => [item.name, item.apiName, item.dataType, item.defaultValue, item.description, item.isPrimary, item.isNameKey]),
    [
      ["第一项", "", "Int", "", "第一项定义", false, false],
      ["第二项", "", "String", "", "第二项定义", false, false],
    ],
  );
  initial[1].apiName = "second";
  initial[1].description = "修改说明";
  const restored = buildAssetPropertyDrafts([selected[1]], initial);
  assert.equal(restored[0].name, "第二项");
  assert.equal(restored[0].apiName, "second");
  assert.equal(restored[0].description, "修改说明");
  assert.equal(original[1].apiName, "dup");
  assert.equal(original[1].description, "第二项定义");
});

test("configuration enforces unique API names, one primary and at most one name key", () => {
  const standard = [property("a", "名称", "字符串型"), property("b", "编号", "数值型")];
  const properties = buildAssetPropertyDrafts(
    standard.map((item, index) => ({ key: String(index), property: item })),
    [],
  );
  const detail = { id: "model", properties: standard };
  assert.throws(() => buildAssetModelConfiguration(detail, draft, properties), /API/);
  properties[0].apiName = "name";
  properties[1].apiName = "name";
  assert.throws(() => buildAssetModelConfiguration(detail, draft, properties), /API/);
  properties[1].apiName = "number";
  assert.throws(() => buildAssetModelConfiguration(detail, draft, properties), /主键/);
  properties[1].isPrimary = true;
  properties[0].isNameKey = true;
  properties[0].defaultValue = "unknown";
  const result = buildAssetModelConfiguration(detail, draft, properties);
  assert.equal(result.properties[0].apiName, "name");
  assert.equal(result.properties[0].defaultValue, "unknown");
  assert.equal(result.properties[1].isPrimary, true);
  result.properties[0].description = "changed";
  assert.equal(properties[0].description, "名称定义");
  properties[0].isPrimary = true;
  assert.throws(() => buildAssetModelConfiguration(detail, draft, properties), /主键/);
  properties[0].isPrimary = false;
  properties[1].isNameKey = true;
  assert.throws(() => buildAssetModelConfiguration(detail, draft, properties), /名称键/);
  properties[1].isNameKey = false;
  properties[0].dataType = "";
  assert.throws(() => buildAssetModelConfiguration(detail, draft, properties), /数据类型/);
});

test("wizard restores distinct selected rows and edited properties when moving between steps", async () => {
  const model = {
    id: "model",
    apiName: "ship",
    name: "舰船",
    description: "",
    properties: [property("dup", "甲", "字符串型"), property("dup", "乙", "数字型")],
  };
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/AssetModelBuildDialog.vue", import.meta.url), "utf8");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const code = ts.transpile(
    `${script}\nreturn { selectAssetModel, selectAssetProperties, goToObjectInfoStep, goToAssetStandardStep, setAssetPropertyKey, detail, selectedIds, objectPropertyList, objectDraft, standardTableRef, buildStep };`,
    { target: ts.ScriptTarget.ES2022 },
  );
  const deps = {
    ...configuration,
    nextTick,
    reactive,
    ref,
    watch,
    onBeforeUnmount: () => {},
    defineModel: () => ref(true),
    defineProps: () => ({ spaceId: "8", categoryTree: [], parentOptions: [], initialCategoryId: "1" }),
    defineEmits: () => () => {},
    assetModelDetailMock: [model],
  };
  const wizard = new Function(...Object.keys(deps), code)(...Object.values(deps));
  wizard.selectAssetModel({ modelId: "model" });
  wizard.selectAssetProperties([...wizard.detail.value.properties]);
  assert.deepEqual(wizard.selectedIds.value, ["0", "1"]);
  wizard.goToObjectInfoStep();
  assert.equal(wizard.buildStep.value, 2);
  wizard.objectPropertyList.value[0].apiName = "alpha";
  wizard.objectPropertyList.value[1].apiName = "beta";
  wizard.objectPropertyList.value[1].description = "编辑定义";
  wizard.setAssetPropertyKey("0", "primary");
  wizard.setAssetPropertyKey("1", "primary");
  wizard.setAssetPropertyKey("0", "name");
  assert.deepEqual(
    wizard.objectPropertyList.value.map((item) => item.isPrimary),
    [false, true],
  );
  assert.deepEqual(
    wizard.objectPropertyList.value.map((item) => item.isNameKey),
    [true, false],
  );
  const selected = [];
  wizard.standardTableRef.value = {
    toggleRowSelection(row) {
      selected.push(row);
      wizard.selectAssetProperties([...selected]);
    },
  };
  await wizard.goToAssetStandardStep();
  assert.equal(selected.length, 2);
  assert.deepEqual(wizard.selectedIds.value, ["0", "1"]);
  wizard.goToObjectInfoStep();
  assert.equal(wizard.objectPropertyList.value[1].apiName, "beta");
  assert.equal(wizard.objectPropertyList.value[1].description, "编辑定义");
  assert.equal(wizard.objectPropertyList.value[1].isPrimary, true);
  wizard.objectPropertyList.value[1].description = "新描述";
  assert.equal(model.properties[1].description, "乙定义");
});
