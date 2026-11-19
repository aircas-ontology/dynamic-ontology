import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/types") {
      specifier = new URL("../src/types/index.ts", import.meta.url).href;
    } else if (specifier.startsWith("@/")) {
      const bare = specifier.slice(2);
      const withTs = new URL(`../src/${bare}${bare.endsWith(".ts") ? "" : ".ts"}`, import.meta.url);
      const withIndex = new URL(`../src/${bare}/index.ts`, import.meta.url);
      if (existsSync(withTs)) specifier = withTs.href;
      else if (existsSync(withIndex)) specifier = withIndex.href;
    } else if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) specifier = candidate.href;
    }
    return nextResolve(specifier, context);
  },
});

const { createOntologyAttributeMetadataWorkspaceData } = await import("../src/mocks/ontologyAttributeMetadataMock/ontologyAttributeMetadataMock.ts");
const { METADATA_VALUE_TYPE_OPTIONS, ROOT_METADATA_PARENT_ID } = await import("../src/types/pages/ontologyAttributeMetadataType.ts");
const {
  addMetadataRecord,
  buildMetadataParentSelectTree,
  buildMetadataTree,
  formatMetadataValueSummary,
  removeMetadataRecord,
  resolveMetadataParentName,
  resolveMetadataValueTypeLabel,
} = await import("../src/views/OntologyObjectAttributePanel/utils/metadataOperations.ts");

test("metadata mock is a parent-child tree with three value types", () => {
  const data = createOntologyAttributeMetadataWorkspaceData();
  const types = new Set(data.items.map((item) => item.valueType));
  assert.deepEqual([...types].sort(), ["enum", "input", "range"]);
  assert.deepEqual(METADATA_VALUE_TYPE_OPTIONS.map((option) => option.value).sort(), ["enum", "input", "range"]);

  const tree = buildMetadataTree(data.items);
  assert.ok(tree.some((node) => node.name === "基础校验"));
  const stringNode = tree.find((node) => node.name === "字符串限制");
  assert.ok(stringNode?.children.some((child) => child.valueType === "range"));
  assert.ok(stringNode?.children.some((child) => child.valueType === "enum"));

  const rangeItem = data.items.find((item) => item.valueType === "range");
  const enumItem = data.items.find((item) => item.valueType === "enum");
  assert.equal(formatMetadataValueSummary(rangeItem), "1 ~ 8");
  assert.equal(formatMetadataValueSummary(enumItem), "启用 / 停用 / 退役");
  assert.equal(resolveMetadataParentName(data.items, ROOT_METADATA_PARENT_ID), "元数据");
  assert.equal(resolveMetadataValueTypeLabel("input"), "输入值");
  assert.equal(resolveMetadataValueTypeLabel("enum"), "枚举");
  assert.equal(resolveMetadataValueTypeLabel("range"), "范围");
});

test("add metadata supports input enum and range under a parent", () => {
  let data = createOntologyAttributeMetadataWorkspaceData();
  data = addMetadataRecord(data, {
    name: "自定义输入",
    parentId: "meta-basic",
    valueType: "input",
    value: "  说明文本  ",
  });
  data = addMetadataRecord(data, {
    name: "动力枚举",
    parentId: ROOT_METADATA_PARENT_ID,
    valueType: "enum",
    value: [" 涡扇 ", "", "涡桨"],
  });
  data = addMetadataRecord(data, {
    name: "速度范围",
    parentId: "meta-string",
    valueType: "range",
    value: { min: 0, max: 3 },
  });

  assert.ok(data.items.some((item) => item.name === "自定义输入" && item.parentId === "meta-basic" && item.value === "说明文本"));
  const enumItem = data.items.find((item) => item.name === "动力枚举");
  assert.deepEqual(enumItem?.value, ["涡扇", "涡桨"]);
  assert.equal(formatMetadataValueSummary(enumItem), "涡扇 / 涡桨");

  assert.throws(() => addMetadataRecord(data, { name: " ", parentId: ROOT_METADATA_PARENT_ID, valueType: "input", value: "x" }), /元数据名称不能为空/);
  assert.throws(() => addMetadataRecord(data, { name: "x", parentId: "missing", valueType: "input", value: "x" }), /父级不存在/);
  assert.throws(() => addMetadataRecord(data, { name: "x", parentId: ROOT_METADATA_PARENT_ID, valueType: "input", value: "  " }), /输入值/);
  assert.throws(() => addMetadataRecord(data, { name: "x", parentId: ROOT_METADATA_PARENT_ID, valueType: "enum", value: [" "] }), /枚举值/);
  assert.throws(
    () => addMetadataRecord(data, { name: "x", parentId: ROOT_METADATA_PARENT_ID, valueType: "range", value: { min: 5, max: 1 } }),
    /最小值不能大于最大值/,
  );
});

test("parent select tree contains only returned roots and preserves children", () => {
  const data = createOntologyAttributeMetadataWorkspaceData();
  const parentTree = buildMetadataParentSelectTree(data.items);
  assert.deepEqual(
    parentTree.map((node) => node.id),
    ["meta-basic", "meta-string"],
  );
  assert.ok(parentTree.find((node) => node.id === "meta-string")?.children.some((node) => node.id === "meta-name-range"));
  assert.deepEqual(buildMetadataParentSelectTree([]), []);
  assert.deepEqual(
    buildMetadataParentSelectTree(data.items, new Set(["meta-basic"])).map((node) => node.id),
    ["meta-string"],
  );
});

test("remove metadata deletes descendants", () => {
  const data = createOntologyAttributeMetadataWorkspaceData();
  const next = removeMetadataRecord(data, "meta-string");
  assert.equal(
    next.items.some((item) => item.id === "meta-string" || item.id === "meta-name-range" || item.id === "meta-status-enum"),
    false,
  );
  assert.ok(next.items.some((item) => item.id === "meta-basic"));
});

test("metadata dialog uses unified tree table without category panel", () => {
  const tableSource = readFileSync(new URL("../src/views/OntologyObjectAttributePanel/components/AttributePropertyTable.vue", import.meta.url), "utf8");
  const pageSource = readFileSync(new URL("../src/views/OntologyObjectAttributePanel/index.vue", import.meta.url), "utf8");
  const dialogSource = readFileSync(new URL("../src/views/OntologyObjectAttributePanel/components/MetadataManageDialog.vue", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("../src/views/OntologyObjectAttributePanel/components/MetadataRuleFormDialog.vue", import.meta.url), "utf8");

  assert.match(tableSource, /元数据管理/);
  assert.match(pageSource, /MetadataManageDialog/);
  assert.match(dialogSource, /添加元数据/);
  assert.doesNotMatch(dialogSource, /添加分类/);
  assert.doesNotMatch(dialogSource, /分类树/);
  assert.doesNotMatch(dialogSource, /MetadataCategoryFormDialog/);
  assert.match(dialogSource, /tree-props/);
  assert.match(dialogSource, /元数据名称/);
  assert.doesNotMatch(dialogSource, /label="父级"/);
  assert.match(formSource, /元数据名称/);
  assert.match(formSource, /label="父级"/);
  assert.match(formSource, /el-tree-select/);
  assert.match(formSource, /输入值/);
  assert.match(formSource, /枚举/);
  assert.match(formSource, /范围|最小值/);
  assert.match(formSource, /el-tag/);
  assert.match(formSource, /添加枚举值/);
  assert.match(formSource, /keyup\.enter/);
  assert.doesNotMatch(formSource, /update-enum-value/);
  assert.equal(existsSync(new URL("../src/views/OntologyObjectAttributePanel/components/MetadataCategoryFormDialog.vue", import.meta.url)), false);
});
