import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { baseParse, compile } from "@vue/compiler-dom";
import { parse } from "@vue/compiler-sfc";
import { renderToString } from "@vue/server-renderer";
import { facilityAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/facilityAssetStandardMock.ts";
import {
  buildAssetModelConfiguration,
  buildAssetOntologyRequest,
  buildAssetPropertyDrafts,
} from "../src/views/ObjectWorkspacePanel/utils/buildAssetModelConfiguration.ts";

const expectedHeaders = [
  "数据元标识符",
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

test("facility images expose 79 ordered properties and all twelve columns", () => {
  assert.equal(facilityAssetStandardProperties.length, 79);
  for (const p of facilityAssetStandardProperties) {
    assert.deepEqual(
      p.metaList.map((m) => m.label),
      expectedHeaders,
      p.id,
    );
    assert.ok(p.metaList.every((m) => typeof m.value === "string" && m.value.length));
    assert.equal(p.metaList[0].value, p.id);
  }
});
test("facility metadata saves every source field independently of edited properties", () => {
  const drafts = buildAssetPropertyDrafts(
    facilityAssetStandardProperties.map((property, index) => ({ key: String(index), property })),
    [],
  );
  drafts.forEach((p, i) => {
    p.apiName = `field_${i}`;
    p.dataType = "String";
    p.description = "修改描述";
  });
  drafts[0].isPrimary = true;
  const config = buildAssetModelConfiguration(
    { id: "facility", properties: facilityAssetStandardProperties },
    { apiName: "facility", displayName: "设施", description: "", iconUrl: "", categoryId: "1" },
    drafts,
  );
  const request = buildAssetOntologyRequest(config, "8");
  request.properties.forEach((p, i) => {
    assert.equal(Object.keys(p.metadata.元数据).length, 12);
    assert.deepEqual(p.metadata, { 元数据: Object.fromEntries(facilityAssetStandardProperties[i].metaList.map((m) => [m.label, m.value])) });
  });
  config.properties[0].metaList[0].value = "changed";
  assert.equal(request.properties[0].metadata.元数据.数据元标识符, "E0001A0000");
  assert.equal(drafts[0].metaList[0].value, "E0001A0000");
});
test("every facility property renders its twelve metadata fields in the existing expand column", async () => {
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
    facilityAssetStandardProperties.map((property, index) => ({ key: String(index), property })),
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

test("facility rules match all eight screenshots and retain duplicate source rows", () => {
  const samples = [
    ["Z0008G0000", "8", "—", "1D", "{TAB1|BB}", "{TAB1|E01002}", "否"],
    ["E0023A0000", "10", "平方米", "1B", "{INT|10}", "[0,MAX]", "否"],
    ["E0045A0000", "10.2", "米", "1B", "{DEC|10.2}", "{DEF}", "否"],
    ["E0063A0000", "4.2", "—", "1B", "{DEC|4.2}", "[0,14]", "否"],
    ["E0065A0000", "6.2", "米每秒", "1B", "{DEC|6.2}", "[0,MAX]", "否"],
    ["E0087A0000", "6.2", "米", "1B", "{DEC|6.2}", "[0,MAX]", "否"],
    ["E0102A0000", "0..50", "—", "1D", "{TAB1|BB}", "{TAB1|E00013}", "是"],
    ["E0104A0000", "2", "—", "1P", "{2X}", "{是;否}", "否"],
  ];
  for (const [id, ...values] of samples)
    assert.deepEqual(
      facilityAssetStandardProperties
        .find((p) => p.id === id)
        .metaList.slice(6)
        .map((m) => m.value),
      values,
      id,
    );
  assert.deepEqual(
    facilityAssetStandardProperties.filter((p) => p.id === "E0117A0000").map((p) => [p.name, p.metaList[9].value]),
    [
      ["油库等级名称", "{TAB1|BB}"],
      ["油库等级代码", "{TAB1|BA}"],
    ],
  );
  assert.deepEqual(
    facilityAssetStandardProperties.filter((p) => p.metaList.at(-1).value === "是").map((p) => p.id),
    ["E0095A0000", "E0102A0000", "E0103A0000"],
  );
  assert.equal(facilityAssetStandardProperties.find((p) => p.id === "E0061A0000").metaList[8].value, "1A");
});
