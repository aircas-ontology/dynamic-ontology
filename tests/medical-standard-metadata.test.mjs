import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { baseParse, compile } from "@vue/compiler-dom";
import { parse } from "@vue/compiler-sfc";
import { renderToString } from "@vue/server-renderer";
import { medicalEquipmentAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/medicalEquipmentAssetStandardMock.ts";
import {
  buildAssetModelConfiguration,
  buildAssetOntologyRequest,
  buildAssetPropertyDrafts,
} from "../src/views/ObjectWorkspacePanel/utils/buildAssetModelConfiguration.ts";

const expectedHeaders = [
  "序号",
  "数据元标识符",
  "数据元名称",
  "数据元简称",
  "数据元定义",
  "数据类型",
  "表示形式",
  "参数",
  "计量单位",
  "组成模式代码",
  "交换格式",
  "数据元值域",
  "多值标识",
];

test("medical images contain 285 unique ordered data elements with thirteen original columns", () => {
  const ids = ["Z0001G0000", "Z0002G0000", ...Array.from({ length: 283 }, (_, i) => `H${1000 + i}A0000`)];
  assert.deepEqual(
    medicalEquipmentAssetStandardProperties.map((p) => p.id),
    ids,
  );
  medicalEquipmentAssetStandardProperties.forEach((p, i) => {
    assert.deepEqual(
      p.metaList.map((m) => m.label),
      expectedHeaders,
      p.id,
    );
    assert.equal(p.metaList[0].value, String(i + 1));
    assert.equal(p.metaList[1].value, p.id);
    assert.ok(p.metaList.every((m) => typeof m.value === "string" && m.value.length));
  });
});
test("medical source metadata saves all thirteen fields independently of editable properties", () => {
  const drafts = buildAssetPropertyDrafts(
    medicalEquipmentAssetStandardProperties.map((property) => ({ key: property.id, property })),
    [],
  );
  drafts.forEach((p, i) => {
    p.apiName = `field_${i}`;
    p.dataType = "String";
    p.description = "修改描述";
  });
  drafts[0].isPrimary = true;
  const config = buildAssetModelConfiguration(
    { id: "medical", properties: medicalEquipmentAssetStandardProperties },
    { apiName: "medical", displayName: "卫生器材", description: "", iconUrl: "", categoryId: "1" },
    drafts,
  );
  const request = buildAssetOntologyRequest(config, "8");
  request.properties.forEach((p, i) => {
    assert.equal(Object.keys(p.metadata.元数据).length, 13);
    assert.deepEqual(p.metadata, { 元数据: Object.fromEntries(medicalEquipmentAssetStandardProperties[i].metaList.map((m) => [m.label, m.value])) });
  });
  config.properties[0].metaList[0].value = "changed";
  assert.equal(request.properties[0].metadata.元数据.序号, "1");
  assert.equal(drafts[0].metaList[0].value, "1");
});
test("every medical property renders its thirteen metadata fields in the existing expand column", async () => {
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
    medicalEquipmentAssetStandardProperties.map((property) => ({ key: property.id, property })),
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
    assert.equal(html.match(/<p>/g)?.length, 13, row.id);
    for (const meta of row.metaList) assert.ok(html.includes(meta.value), `${row.id}: ${meta.label}`);
    assert.ok(!html.includes("暂无元数据"), row.id);
    assert.doesNotMatch(html, /<select|<input|<button|<script/i);
  }
});

test("medical columns preserve source samples across all thirty-five images", () => {
  const samples = [
    ["Z0001G0000", "9", "—", "1A", "{9X}", "{DEF}", "否"],
    ["H1004A0000", "0..14", "—", "1A", "{*14X}", "{DEF}", "否"],
    ["H1010A0000", "0..10", "—", "2D1B", "{TAB1|BA}|{TAB2|BA}|{INT|4}", "{TAB1|H02002}|{TAB2|H02003}|{DEF}", "否"],
    ["H1021A0000", "0..8", "摄氏度", "1F", "{INT|3}|{INT|3}", "[-100,100]|[-100,100]", "否"],
    ["H1028A0000", "0..100", "—", "1D3B", "{TAB1|BA}|{INT|3}|{INT|3}|{INT|3}", "{TAB1|H02011}|{DEF}|{DEF}|{DEF}", "否"],
    ["H1032A0000", "0..100", "—", "1A", "{*10X}", "{DEF}", "否"],
    ["H1036A0000", "0..8", "次每分", "1F", "{INT|3}|{INT|3}", "[0,200]|[0,200]", "否"],
    ["H1041A0000", "0..8", "毫米汞柱", "1F", "{INT|3}|{INT|3}", "[0,300]|[0,300]", "否"],
    ["H1048A0000", "2", "—", "1P", "{2X}", "{是，否}", "否"],
    ["H1061A0000", "0..100", "—", "1D1B1B", "{TAB1|BA}|{DEC|5.2}", "{TAB1|H02004}|{DEF}|(0,MAX]", "否"],
    ["H1067A0000", "4.3", "千帕", "1B", "{DEC|4.3}", "[-1,1]", "否"],
    ["H1076A0000", "0..8", "焦耳", "1F", "{INT|3}|{INT|3}", "[0,500]|[0,500]", "否"],
    ["H1086A0000", "1", "—", "1D", "{TAB1|BA}", "{TAB1|H02016}", "否"],
    ["H1095A0000", "0..6", "毫升每小时", "1B", "{DEC|2.1}|{DEC|2.1}", "[0,MAX]|[0,MAX]", "否"],
    ["H1103A0000", "0..100", "—", "1D1B", "{TAB1|BA}|{INT|6}", "{TAB1|H02004}|{DEF}", "否"],
    ["H1113A0000", "2.1", "厘米", "1B", "{DEC|2.1}", "[0,MAX]", "否"],
    ["H1119A0000", "0..100", "—", "1A", "{*100}", "{DEF}", "否"],
    ["H1123A0000", "0..200", "—", "1A", "{*200}", "{DEF}", "否"],
    ["H1135A0000", "0..10", "毫米汞柱", "1F", "{INT|4}|{INT|4}", "[0,MAX)|(0,MAX]", "否"],
    ["H1140A0000", "4", "毫升", "1B", "{INT|4}", "{DEF}", "否"],
    ["H1147A0000", "6", "流明", "1B", "{INT|6}", "[0,MAX]", "否"],
    ["H1157A0000", "0..100", "—", "1D1B", "{TAB1|BA}|{INT|3}", "{TAB1|H02011}|(0,MAX]", "否"],
    ["H1164A0000", "0..100", "—", "1D2B", "{TAB1|BA}|{INT|3}|{INT|3}", "{TAB1|H02011}|[0,100)|(0,100]", "否"],
    ["H1174A0000", "20", "—", "1D", "{TAB1|BA}", "{TAB1|H02022}", "是"],
    ["H1186A0000", "6", "微升", "1B", "{INT|6}", "{DEF}", "否"],
    ["H1188A0000", "2", "秒", "1A", "{INT|2}", "(0,MAX]", "否"],
    ["H1199A0000", "0..100", "—", "1D1B", "{TAB1|BA}|{DEC|10.2}", "{TAB1|H02008}|(0,MAX]", "否"],
    ["H1209A0000", "0..5", "转每分", "1B", "{INT|5}", "[0,MAX)", "否"],
    ["H1218A0000", "0..8", "微升", "1B", "{INT|3}|{INT|3}", "(0,MAX)|(0,MAX]", "否"],
    ["H1224A0000", "0..6", "摄氏度", "1F", "{INT|2}|{INT|2}", "[0,MAX)|(0,MAX]", "否"],
    ["H1236A0000", "2", "—", "1D", "{TAB1|BA}", "{TAB1|H02024}", "是"],
    ["H1240A0000", "0..8", "毫米", "1A", "{INT|3}|{INT|3}", "[0,MAX)|(0,MAX]", "否"],
    ["H1251A0000", "0..10", "牛顿", "1A", "{INT|4}|{INT|4}", "[0,MAX)|(0,MAX]", "否"],
    ["H1260A0000", "0..8", "升每分", "1F", "{DEC|3.1}|{DEC|3.1}", "[0,MAX)|(0,MAX]", "否"],
    ["H1268A0000", "0..100", "—", "1A", "{*100X}", "{DEF}", "否"],
    ["H1282A0000", "2", "—", "1P", "{2X}", "{是，否}", "否"],
  ];
  for (const [id, ...cells] of samples)
    assert.deepEqual(
      medicalEquipmentAssetStandardProperties
        .find((p) => p.id === id)
        .metaList.slice(7)
        .map((m) => m.value),
      cells,
      id,
    );
  assert.deepEqual(
    medicalEquipmentAssetStandardProperties.filter((p) => p.metaList.at(-1).value === "是").map((p) => p.id),
    [1019, 1020, 1024, 1030, 1063, 1064, 1174, 1223, 1236, 1239, 1277].map((n) => `H${n}A0000`),
  );
  const sourceTypes = { H1029A0000: "字符串型", H1140A0000: "字符串型", H1188A0000: "字符串型", H1222A0000: "数值型" };
  for (const [id, value] of Object.entries(sourceTypes))
    assert.equal(medicalEquipmentAssetStandardProperties.find((p) => p.id === id).metaList[5].value, value, id);
  assert.deepEqual(
    medicalEquipmentAssetStandardProperties.filter((p) => /^H114[0-6]A0000$/.test(p.id) || p.id === "H1139A0000").map((p) => p.name),
    ["补偿功能", "气囊最大体积", "手术灯类型", "安装模式", "光源类型", "光源数量", "灯珠数量", "灯体结构"],
  );
});

test("medical exchange formats retain original mismatches and missing X markers", () => {
  for (const [id, parameter, format] of [
    ["H1032A0000", "0..100", "{*10X}"],
    ["H1231A0000", "0..20", "{*100X}"],
    ["H1232A0000", "0..20", "{*100X}"],
    ["H1129A0000", "0..100", "{*100}"],
  ]) {
    const p = medicalEquipmentAssetStandardProperties.find((p) => p.id === id);
    assert.equal(p.metaList[7].value, parameter);
    assert.equal(p.metaList[10].value, format);
  }
});
