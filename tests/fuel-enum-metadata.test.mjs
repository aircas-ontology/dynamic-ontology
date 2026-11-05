import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { baseParse, compile } from "@vue/compiler-dom";
import { parse } from "@vue/compiler-sfc";
import { renderToString } from "@vue/server-renderer";
import { oilAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/oilAssetStandardMock.ts";
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

test("oil image rows are deduplicated and expose all twelve original headers", () => {
  const expectedIds = ["Z0001G0000", "Z0005G0000", "Z0006G0000", "Z0007G0000"];
  for (let index = 1; index <= 75; index += 1) expectedIds.push(`W${String(index).padStart(4, "0")}A0000`);
  assert.deepEqual(
    oilAssetStandardProperties.map((item) => item.id),
    expectedIds,
  );
  for (const property of oilAssetStandardProperties) {
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
      [property.id, property.name, property.shortName || "—", property.description, property.dataType, property.representation],
    );
    assert.equal(property.enumValues, undefined);
  }
});

test("oil metadata preserves image code references, ranges, units and multi-value flags", () => {
  const cases = [
    ["Z0001G0000", ["9", "—", "1A", "{9X}", "{DEF}", "否"]],
    ["Z0005G0000", ["7", "—", "1D", "{TAB1|BA}", "{TAB1|W01001}", "否"]],
    ["W0001A0000", ["7", "—", "1D", "{TAB1|BA}", "{TAB1|W02001}", "否"]],
    ["W0004A0000", ["2", "—", "1P", "{2X}", "{有,无}", "否"]],
    ["W0007A0000", ["0..200", "—", "2D1B", "{TAB1|BA}||{TAB2|BA}|{INT|3}", "{TAB1|W02007}|{TAB2|W02024}|{DEF}", "是"]],
    ["W0012A0000", ["3", "—", "1D1B", "{TAB1|BA}|{INT|2}", "{TAB1|W02026}|[10,99]", "否"]],
    ["W0028A0000", ["0..80", "—", "1F", "{DEC|3.1}|{DEC|3.1}", "{DEF}", "否"]],
    ["W0025A0000", ["0..50", "—", "3D1B", "{TAB1|BA}|{TAB2|BA}|{TAB3|BA|{DEC|4.1}", "{TAB1|W02013}|{TAB2|W02024}|{TAB3|W02026}|{DEF}", "否"]],
    ["W0034A0000", ["0..200", "—", "3D1B", "{TAB1|BA}|{TAB2|BA}|{TAB3|BA}|{INT|2}", "{TAB1|W02016}|{TAB2|W02024}|{TAB3|W02026}|(-80,0)", "是"]],
    ["W0039A0000", ["0..200", "—", "3D1A", "{TAB1|BA}|{TAB2|BA}|{TAB3|BA}|{*X}", "{TAB1|W02016}|{TAB2|W02024}|{TAB3|W02026}|{DEF}", "是"]],
    ["W0047A0000", ["5", "—", "1B", "{DEC|4.3}", "{0,1}", "否"]],
    ["W0052A0000", ["0..200", "—", "3D1F", "{TAB1|BA}|{TAB2|BA}|{TAB3|BA}|{INT|3}|{INT|3}", "{TAB1|W02016}|{TAB2|W02024}|{TAB3|W02026}|{DEF}", "是"]],
    ["W0061A0000", ["0..20", "—", "1F", "{DEC|3.1}|{DEC|3.1}", "[0,14]|[0,14]", "否"]],
    ["W0069A0000", ["0..40", "℃", "1D1F", "{TAB1|BA}|{INT|3}|{INT|3}", "{TAB1|W02024}|[-80,20]|[0,400]", "否"]],
    ["W0074A0000", ["0..20", "—", "1D1B", "{TAB1|BA}|{{DEC|5.1}", "{TAB1|W02024}|{DEF}", "否"]],
    [
      "W0075A0000",
      [
        "9",
        "—",
        "5D1B",
        "{TAB1|BA}|{TAB2|BA}|{TAB3|BA}|{TAB4|BA}|{TAB5|BA}|{DEC|3.2}",
        "{TAB1|W02003}|{TAB2|W02004}|{TAB3|W02006}|{TAB4|W02026}|{TAB5|W02027}|[0,1]",
        "否",
      ],
    ],
  ];
  for (const [id, expected] of cases) {
    const property = oilAssetStandardProperties.find((item) => item.id === id);
    assert.ok(property, id);
    assert.deepEqual(
      property.metaList.slice(6).map((item) => item.value),
      expected,
      id,
    );
  }
});

test("oil source metadata survives draft edits, repeated selection and request copying", () => {
  const property = oilAssetStandardProperties.find((item) => item.id === "W0047A0000");
  const selected = [{ key: property.id, property }];
  const drafts = buildAssetPropertyDrafts(selected, []);
  drafts[0].apiName = "loss_factor";
  drafts[0].isPrimary = true;
  drafts[0].description = "编辑后的属性描述";
  assert.equal(drafts[0].dataType, "Int");
  assert.equal(drafts[0].metaList[4].value, "数值型");
  assert.equal(drafts[0].metaList[3].value, property.description);
  const repeated = buildAssetPropertyDrafts(selected, drafts);
  assert.equal(repeated[0].description, "编辑后的属性描述");
  const config = buildAssetModelConfiguration(
    { id: "oil", properties: [property] },
    { apiName: "oil", displayName: "油品", description: "", iconUrl: "", categoryId: "1" },
    repeated,
  );
  const request = buildAssetOntologyRequest(config, "8");
  assert.deepEqual(request.properties[0].metadata, { 元数据: Object.fromEntries(property.metaList.map(({ label, value }) => [label, value])) });
  config.properties[0].metaList[0].value = "修改配置";
  assert.equal(request.properties[0].metadata.元数据.数据元标识符, property.id);
  repeated[0].metaList[1].value = "修改草稿";
  assert.equal(drafts[0].metaList[0].value, property.id);
  assert.equal(drafts[0].metaList[1].value, property.name);
  assert.equal(property.metaList[0].value, property.id);
  assert.equal(property.metaList[1].value, property.name);
});

test("expanded metadata renders every source column, escapes text and handles absent metadata", async () => {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/AssetModelBuildDialog.vue", import.meta.url), "utf8");
  const root = baseParse(parse(source).descriptor.template.content);
  /** @description 查找属性展开列。 @param {object} node 模板节点。 @returns {object | undefined} 展开列。 */
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
  const example = oilAssetStandardProperties.find((property) => property.id === "W0069A0000");
  const rows = buildAssetPropertyDrafts([{ key: example.id, property: example }], []);
  const unsafe = structuredClone(rows[0]);
  unsafe.metaList[3].value = "<script>alert(1)</script>";
  rows.push(unsafe, {
    ...rows[0],
    metaList: [
      { label: "数据元标识符", value: "legacy" },
      { label: "表示形式", value: "代码文本" },
    ],
  });
  for (const [index, row] of rows.entries()) {
    const app = Vue.createSSRApp({ render });
    app.component("el-table-column", {
      inheritAttrs: false,
      setup(_props, { slots }) {
        return () => slots.default?.({ row });
      },
    });
    const html = await renderToString(app);
    if (index < 2) {
      for (const header of expectedHeaders) assert.ok(html.includes(`${header}：`), header);
      assert.ok(html.includes("{TAB1|W02024}|[-80,20]|[0,400]"));
      assert.ok(html.includes("℃"));
      assert.ok(!html.includes("暂无元数据"));
      if (index === 1) assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
    } else {
      assert.ok(html.includes("暂无元数据"));
      assert.ok(!html.includes("legacy"));
    }
    assert.doesNotMatch(html, /<select|<input|<button|<script/i);
  }
});
