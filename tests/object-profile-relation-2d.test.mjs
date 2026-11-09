import test from "node:test";
import assert from "node:assert/strict";
import * as echarts from "echarts";
import { buildObjectProfileRelationOption } from "../src/views/EntityBrowsingObjectProfile/utils/buildObjectProfileRelationOption.ts";

test("profile relations render nodes and links with ECharts", () => {
  const chart = echarts.init(null, null, { renderer: "svg", ssr: true, width: 600, height: 200 });
  try {
    chart.setOption(
      buildObjectProfileRelationOption("中心", [{ id: "a", name: "节点 A" }], {
        primary: "#00aaff",
        background: "#001122",
        border: "#448899",
        text: "#ffffff",
      }),
    );
    const svg = chart.renderToSVGString();
    assert.match(svg, /中心/);
    assert.match(svg, /节点 A/);
    assert.match(svg, /stroke-dasharray/);
  } finally {
    chart.dispose();
  }
});

test("profile graph uses centered and outlined nodes with dashed links", () => {
  const option = buildObjectProfileRelationOption("中心", [{ id: "a", name: "节点 A" }], {
    primary: "blue",
    background: "navy",
    border: "gray",
    text: "white",
  });
  const graph = option.series[0];
  assert.equal(graph.roam, true);
  assert.equal(graph.data[0].name, "中心");
  assert.equal(graph.data[0].itemStyle.color, "blue");
  assert.equal(graph.data[1].itemStyle.color, "navy");
  assert.equal(graph.data[1].itemStyle.borderColor, "gray");
  assert.equal(graph.data[1].draggable, true);
  assert.equal(graph.label.position, "bottom");
  assert.equal(graph.lineStyle.type, "dashed");
  assert.deepEqual(graph.links, [{ source: "center", target: "a" }]);
});

test("profile graph uses fresh nodes and colors on data or theme changes", () => {
  const colors = { primary: "one", background: "two", border: "three", text: "four" };
  const first = buildObjectProfileRelationOption("旧中心", [{ id: "old", name: "旧节点" }], colors);
  const second = buildObjectProfileRelationOption("新中心", [{ id: "new", name: "新节点" }], { ...colors, primary: "new-color" });
  assert.equal(first.series[0].data[0].name, "旧中心");
  assert.equal(second.series[0].data[0].name, "新中心");
  assert.equal(second.series[0].data[0].itemStyle.color, "new-color");
  assert.deepEqual(second.series[0].links, [{ source: "center", target: "new" }]);
});
