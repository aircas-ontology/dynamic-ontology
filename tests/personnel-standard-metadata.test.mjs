import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { baseParse, compile } from "@vue/compiler-dom";
import { parse } from "@vue/compiler-sfc";
import { renderToString } from "@vue/server-renderer";
import { personnelAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/personnelAssetStandardMock.ts";
import {
  buildAssetModelConfiguration,
  buildAssetOntologyRequest,
  buildAssetPropertyDrafts,
} from "../src/views/ObjectWorkspacePanel/utils/buildAssetModelConfiguration.ts";

const expectedHeaders = [
  "数据元统一标识符",
  "数据元名称",
  "数据元简称",
  "数据元定义",
  "数据元值的数据类型",
  "数据元值的表示形式",
  "数据元值的参数",
  "数据元值的计量单位",
  "数据元值的组成模式代码",
  "数据元值的交换格式",
  "数据元的值域",
  "数据元取多值标识",
];

test("personnel images expose 57 ordered unique properties and all twelve columns", () => {
  assert.deepEqual(
    personnelAssetStandardProperties.map((p) => p.id),
    [
      "R0001A0000",
      "Z0005G0000",
      "Z0006G0000",
      ...Array.from({ length: 41 }, (_, i) => "R" + String(i + 2).padStart(4, "0") + "A0000"),
      ...[50, 51, 60, 61, 62, 70, 71, 72, 73, 74, 80, 81, 82].map((i) => "R" + String(i).padStart(4, "0") + "A0000"),
    ],
  );
  for (const p of personnelAssetStandardProperties) {
    assert.deepEqual(
      p.metaList.map((m) => m.label),
      expectedHeaders,
      p.id,
    );
    assert.ok(p.metaList.every((m) => typeof m.value === "string" && m.value.length));
    assert.equal(p.metaList[0].value, p.id);
  }
});
test("personnel metadata saves every source field independently of edited properties", () => {
  const drafts = buildAssetPropertyDrafts(
    personnelAssetStandardProperties.map((property) => ({ key: property.id, property })),
    [],
  );
  drafts.forEach((p, i) => {
    p.apiName = `field_${i}`;
    p.dataType = "String";
    p.description = "修改描述";
  });
  drafts[0].isPrimary = true;
  const config = buildAssetModelConfiguration(
    { id: "personnel", properties: personnelAssetStandardProperties },
    { apiName: "personnel", displayName: "人员", description: "", iconUrl: "", categoryId: "1" },
    drafts,
  );
  const request = buildAssetOntologyRequest(config, "8");
  request.properties.forEach((p, i) => {
    assert.equal(Object.keys(p.metadata.元数据).length, 12);
    assert.deepEqual(p.metadata, { 元数据: Object.fromEntries(personnelAssetStandardProperties[i].metaList.map((m) => [m.label, m.value])) });
  });
  config.properties[0].metaList[0].value = "changed";
  assert.equal(request.properties[0].metadata.元数据.数据元统一标识符, "R0001A0000");
  assert.equal(drafts[0].metaList[0].value, "R0001A0000");
});
test("every personnel property renders its twelve metadata fields in the existing expand column", async () => {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/AssetModelBuildDialog.vue", import.meta.url), "utf8");
  const root = baseParse(parse(source).descriptor.template.content);
  /** @description 查找元数据展开列。 @param {object} node 模板节点。 @returns {object | undefined} 展开列。 */
  function findExpandColumn(node) {
    if (node.type === 1 && node.tag === "el-table-column" && node.props.some((item) => item.name === "type" && item.value?.content === "expand")) return node;
    for (const child of node.children ?? []) {
      const found = findExpandColumn(child);
      if (found) return found;
    }
  }
  const column = findExpandColumn(root);
  assert.ok(column);
  const render = new Function("Vue", compile(column.loc.source, { mode: "function" }).code)(Vue);
  const drafts = buildAssetPropertyDrafts(
    personnelAssetStandardProperties.map((property) => ({ key: property.id, property })),
    [],
  );
  for (const row of drafts) {
    const app = Vue.createSSRApp({ render });
    app.component("el-table-column", {
      inheritAttrs: false,
      setup(_props, { slots }) {
        return () => slots.default?.({ row });
      },
    });
    const html = await renderToString(app);
    for (const header of expectedHeaders) assert.ok(html.includes(`${header}：`), `${row.id}: ${header}`);
    assert.equal(html.match(/<p>/g)?.length, 12, row.id);
    for (const meta of row.metaList) assert.ok(html.includes(meta.value), `${row.id}: ${meta.label}`);
    assert.ok(!html.includes("暂无元数据"), row.id);
    assert.doesNotMatch(html, /<select|<input|<button|<script/i);
  }
});

test("personnel samples preserve source rules across six screenshots", () => {
  const samples = [
    ["R0001A0000", "1..30", "—", "1A", "{*30X}", "{DEF}", "否"],
    ["R0019A0000", "3", "厘米", "1B", "{INT|3}", "(0,MAX)", "否"],
    ["R0028A0000", "0..500", "—", "1A", "{*500X}", "{DEF}", "是"],
    ["R0039A0000", "2", "—", "1P", "{2X}", "{是;否}", "否"],
    ["R0072A0000", "2", "—", "1D", "{TAB1|BA}", "{TAB1|R00013}", "否"],
    ["R0082A0000", "0..500", "—", "1A", "{*500X}", "{DEF}", "否"],
  ];
  for (const [id, ...values] of samples)
    assert.deepEqual(
      personnelAssetStandardProperties
        .find((p) => p.id === id)
        .metaList.slice(6)
        .map((m) => m.value),
      values,
      id,
    );
  assert.deepEqual(
    personnelAssetStandardProperties.filter((p) => p.metaList.at(-1).value === "是").map((p) => p.id),
    [6, 7, 27, 28, 29].map((i) => "R" + String(i).padStart(4, "0") + "A0000"),
  );
  for (const i of [15, 22, 34, 40]) {
    const p = personnelAssetStandardProperties.find((p) => p.id === "R" + String(i).padStart(4, "0") + "A0000");
    assert.equal(p.metaList[4].value, "日期时间型");
    assert.equal(p.metaList[9].value, i === 15 ? "{YYYYMMDD}" : "{YYYYMM}");
  }
});
