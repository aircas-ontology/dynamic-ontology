import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { baseParse, compile } from "@vue/compiler-dom";
import { parse } from "@vue/compiler-sfc";
import { renderToString } from "@vue/server-renderer";
import { aviationMaterialAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/aviationMaterialAssetStandardMock.ts";
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

test("aviation images expose 212 ordered unique properties and all twelve columns", () => {
  assert.deepEqual(
    aviationMaterialAssetStandardProperties.map((p) => p.id),
    [
      ...Array.from({ length: 7 }, (_, i) => `Z${String(i + 1).padStart(4, "0")}G0000`),
      ...Array.from({ length: 205 }, (_, i) => `H${String(i + 1).padStart(4, "0")}A0000`),
    ],
  );
  for (const p of aviationMaterialAssetStandardProperties) {
    assert.deepEqual(
      p.metaList.map((m) => m.label),
      expectedHeaders,
      p.id,
    );
    assert.ok(p.metaList.every((m) => typeof m.value === "string" && m.value.length));
    assert.equal(p.metaList[0].value, p.id);
  }
});
test("aviation metadata saves every source field independently of edited properties", () => {
  const drafts = buildAssetPropertyDrafts(
    aviationMaterialAssetStandardProperties.map((property) => ({ key: property.id, property })),
    [],
  );
  drafts.forEach((p, i) => {
    p.apiName = `field_${i}`;
    p.dataType = "String";
    p.description = "修改描述";
  });
  drafts[0].isPrimary = true;
  const config = buildAssetModelConfiguration(
    { id: "aviation", properties: aviationMaterialAssetStandardProperties },
    { apiName: "aviation", displayName: "航材", description: "", iconUrl: "", categoryId: "1" },
    drafts,
  );
  const request = buildAssetOntologyRequest(config, "8");
  request.properties.forEach((p, i) => {
    assert.equal(Object.keys(p.metadata.元数据).length, 12);
    assert.deepEqual(p.metadata, { 元数据: Object.fromEntries(aviationMaterialAssetStandardProperties[i].metaList.map((m) => [m.label, m.value])) });
  });
  config.properties[0].metaList[0].value = "changed";
  assert.equal(request.properties[0].metadata.元数据.数据元标识符, "Z0001G0000");
  assert.equal(drafts[0].metaList[0].value, "Z0001G0000");
});
test("every aviation property renders its twelve metadata fields in the existing expand column", async () => {
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
    aviationMaterialAssetStandardProperties.map((property) => ({ key: property.id, property })),
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

test("aviation source columns match samples from all twenty-three screenshots", () => {
  const samples = [
    ["Z0005G0000", "8", "—", "1D", "{TAB1|BA}", "{TAB1|H01001}", "否"],
    ["H0009A0000", "12.3", "克", "1B", "{DEC|12.3}", "(0,1000000000)", "否"],
    ["H0014A0000", "—", "—", "1R", "{YYYY}-{MM}-{DD}", "—", "否"],
    ["H0022A0000", "12.3", "千字节", "1N", "{DEC|12.3}", "(0,1000000000)", "是"],
    ["H0031A0000", "—", "—", "1R", "{YYYY}-{MM}-{DD}", "—", "是"],
    ["H0040A0000", "12.3", "毫安", "1B", "{DEC|12.3}", "(0,1000000000)", "否"],
    ["H0055A0000", "8", "套", "1B", "{INT|8}", "(0,99999999]", "否"],
    ["H0067A0000", "12.3", "赫兹", "1F", "{DEC|12.3}", "(0,1000000000)|(0,1000000000)", "否"],
    ["H0072A0000", "12.3", "—", "1B", "{DEC|12.3}", "(-1000000000,1000000000)", "否"],
    ["H0086A0000", "12.4", "—", "1B", "{DEC|12.4}", "[0,1]", "否"],
    ["H0095A0000", "0..80", "—", "1A", "{*80X}", "{DEF}", "否"],
    ["H0106A0000", "12.3", "毫米", "1B", "{DEC|12.3}", "(0,1000000000)", "否"],
    ["H0113A0000", "12.3", "千兆字节", "1B", "{DEC|12.3}", "(0,1000000000)", "否"],
    ["H0125A0000", "7.2", "摄氏度", "1F", "{DEC|7.2}", "(0,100000)|(0,100000)", "否"],
    ["H0130A0000", "12.3", "米", "1B", "{DEC|12.3}", "(0,1000000000)", "否"],
    ["H0138A0000", "12.4", "毫秒", "1B", "{DEC|12.4}", "(0,1000000000)", "否"],
    ["H0144A0000", "12.3", "赫兹", "1F", "{DEC|12.3}", "(0,1000000000)|(0,1000000000)", "否"],
    ["H0151A0000", "12.3", "立方毫米/秒", "1B", "{DEC|12.3}", "(0,1000000000)", "否"],
    ["H0160A0000", "5.2", "度", "1B", "{DEC|5.2}", "[0,1000)|(0,1000)", "否"],
    ["H0173A0000", "0..80", "—", "1A", "{*80X}", "{DEF}", "是"],
    ["H0183A0000", "12.3", "—", "1B", "{DEC|12.3}", "[0,1]", "否"],
    ["H0185A0000", "8", "个", "1B", "{DEC|10}", "(0,1000000000)", "否"],
    ["H0196A0000", "8", "个", "1B", "{DEC|10}", "(0,1000000000)", "否"],
    ["H0203A0000", "12.3", "堪德拉/平方米", "1B", "{DEC|12.3}", "(0,1000000000)", "否"],
  ];
  for (const [id, ...cells] of samples)
    assert.deepEqual(
      aviationMaterialAssetStandardProperties
        .find((p) => p.id === id)
        .metaList.slice(6)
        .map((m) => m.value),
      cells,
      id,
    );
  assert.deepEqual(
    aviationMaterialAssetStandardProperties.filter((p) => p.metaList[11].value === "是").map((p) => p.id),
    ["Z0003G0000", "Z0004G0000", "H0022A0000", "H0031A0000", "H0052A0000", "H0054A0000", "H0057A0000", "H0173A0000"],
  );
  assert.equal(aviationMaterialAssetStandardProperties.find((p) => p.id === "H0101A0000").name, "报警阈值");
  assert.equal(aviationMaterialAssetStandardProperties.find((p) => p.id === "H0022A0000").metaList[4].value, "二进制型");
  assert.equal(aviationMaterialAssetStandardProperties.find((p) => p.id === "H0147A0000").metaList[3].value, "温度传感器探测结冰与否的原理方法类别");
});
