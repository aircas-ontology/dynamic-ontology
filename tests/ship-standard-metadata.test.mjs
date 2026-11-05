import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { baseParse, compile } from "@vue/compiler-dom";
import { parse } from "@vue/compiler-sfc";
import { renderToString } from "@vue/server-renderer";
import { civilTransportShipAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/civilTransportShipAssetStandardMock.ts";
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

test("ship image rows retain 108 unique corresponding properties with all twelve source columns", () => {
  const expectedIds = ["Z0001G0000", "D0001A0000", "D0002A0000", "Z0004G0000", "Z0005G0000", "Z0006G0000", "Z0007G0000"];
  for (let index = 3; index <= 103; index += 1) expectedIds.push(`D${String(index).padStart(4, "0")}A0000`);
  assert.deepEqual(
    civilTransportShipAssetStandardProperties.map((item) => item.id),
    expectedIds,
  );
  for (const property of civilTransportShipAssetStandardProperties) {
    assert.deepEqual(
      property.metaList.map((item) => item.label),
      expectedHeaders,
      property.id,
    );
    assert.ok(
      property.metaList.every((item) => item.value.trim()),
      property.id,
    );
    assert.deepEqual(
      property.metaList.slice(0, 6).map((item) => item.value),
      [
        property.id === "D0096A0000" ? "0096A0000" : property.id,
        property.name,
        property.shortName || "—",
        property.description,
        property.dataType,
        property.representation,
      ],
    );
    assert.equal(property.enumValues, undefined);
  }
});

test("ship source metadata preserves code references, dates, units, blank cells and dimension separators", () => {
  const cases = [
    ["D0002A0000", ["0..100", "—", "1A", "{*100X}", "{DEF}", "是"]],
    ["Z0005G0000", ["7", "—", "1D", "{TAB1|BA}", "{TAB1|D01001}", "是"]],
    ["D0005A0000", ["4..8", "—", "1D", "{TAB1|BB}", "{TAB1|D01003}", "否"]],
    ["D0006A0000", ["0..40", "吨级", "1D", "{TAB1|BB}", "{TAB1|D01004}", "否"]],
    ["D0009A0000", ["8.2", "米", "1B", "{DEC|8.2}", "{DEF}", "否"]],
    ["D0016A0000", ["16", "—", "1B", "{INT|16}", "{DEF}", "否"]],
    ["D0024A0000", ["16.2", "千瓦", "1B", "{DEC|16.2}", "{DEF}", "否"]],
    ["D0027A0000", ["8.2", "海里每小时", "1B", "{DEC|8.2}", "{DEF}", "否"]],
    ["D0031A0000", ["0..6", "—", "1D", "{TAB1|BB}", "{TAB1|D01010}", "是"]],
    ["D0032A0000", ["4", "人", "—", "{INT|4}", "{DEF}", "否"]],
    ["D0038A0000", ["—", "—", "1R", "{YYYY}-{MM}-{DD}", "—", "否"]],
    ["D0044A0000", ["4", "—", "1A", "{TAB1|BB}", "{TAB1|D01011}", "是"]],
    ["D0057A0000", ["3", "人", "1B", "{INT|3}", "{DEF}", "否"]],
    ["D0060A0000", ["—", "—", "1R", "{YYYY}-{MM}-{DD}", "—", "否"]],
    ["D0063A0000", ["0..1000", "—", "1A", "{*1000X}", "{DEF}", "否"]],
    ["D0070A0000", ["8.1", "吨每平方米", "1B", "{DEC|8.1}", "{DEF}", "否"]],
    ["D0076A0000", ["8.1", "毫米", "1B", "{DEC|8.1}", "{DEF}", "否"]],
    ["D0093A0000", ["6", "毫米×毫米", "2B", "{INT|6}×{INT|6}", "{DEF}", "否"]],
    ["D0094A0000", ["6", "毫米×毫米", "2B", "{INT|6}×{INT|6}", "{DEF}", "否"]],
    ["D0102A0000", ["8", "立方米", "1B", "{INT|8}", "{DEF}", "否"]],
    ["D0103A0000", ["8.2", "千瓦", "1B", "{DEC|8.2}", "{DEF}", "否"]],
  ];
  for (const [id, expected] of cases) {
    const property = civilTransportShipAssetStandardProperties.find((item) => item.id === id);
    assert.ok(property, id);
    assert.deepEqual(
      property.metaList.slice(6).map((item) => item.value),
      expected,
      id,
    );
  }
  const maximumLift = civilTransportShipAssetStandardProperties.find((item) => item.id === "D0096A0000");
  assert.equal(maximumLift.name, "最大起重能力");
  assert.equal(maximumLift.metaList[0].value, "0096A0000", "source identifier spelling is retained while matching the existing property");
  assert.deepEqual(
    civilTransportShipAssetStandardProperties.filter((item) => item.metaList.at(-1).value === "是").map((item) => item.id),
    ["D0002A0000", "Z0004G0000", "Z0005G0000", "Z0006G0000", "Z0007G0000", "D0031A0000", "D0044A0000"],
  );
});

test("ship metadata remains original when editable property types and descriptions change", () => {
  const selected = ["D0038A0000", "D0045A0000", "D0093A0000"].map((id) => ({
    key: id,
    property: civilTransportShipAssetStandardProperties.find((item) => item.id === id),
  }));
  const drafts = buildAssetPropertyDrafts(selected, []);
  assert.deepEqual(
    drafts.map((item) => item.dataType),
    ["Timestamp", "Int", "Int"],
  );
  assert.deepEqual(
    drafts.map((item) => item.metaList[4].value),
    ["日期时间型", "数字型", "数值型"],
  );
  drafts.forEach((item, index) => {
    item.apiName = `property_${index}`;
  });
  drafts[0].isPrimary = true;
  drafts[0].description = "编辑后的日期说明";
  const repeated = buildAssetPropertyDrafts(selected, drafts);
  const config = buildAssetModelConfiguration(
    { id: "ship", properties: selected.map((item) => item.property) },
    { apiName: "ship", displayName: "民用运输船舶", description: "", iconUrl: "", categoryId: "1" },
    repeated,
  );
  const request = buildAssetOntologyRequest(config, "8");
  assert.deepEqual(
    request.properties.map((item) => item.metadata),
    selected.map(({ property }) => ({ 元数据: Object.fromEntries(property.metaList.map(({ label, value }) => [label, value])) })),
  );
  assert.equal(config.properties[0].metaList[3].value, selected[0].property.description);
  config.properties[0].metaList[0].value = "修改配置";
  repeated[0].metaList[1].value = "修改草稿";
  assert.equal(drafts[0].metaList[0].value, "D0038A0000");
  assert.equal(drafts[0].metaList[1].value, "取得日期");
  assert.equal(selected[0].property.metaList[0].value, "D0038A0000");
});

test("every ship property renders its twelve metadata fields in the existing expand column", async () => {
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
    civilTransportShipAssetStandardProperties.map((property) => ({ key: property.id, property })),
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
