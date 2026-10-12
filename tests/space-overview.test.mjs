import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ontologySpaceManagementDetailMock } from "../src/mocks/ontologySpaceManagementDetailMock/ontologySpaceManagementDetailMock.ts";
import { formatOverviewStat } from "../src/views/SpaceOverviewPanel/utils/overviewStats.ts";
test("navy overview counts match existing space totals", () => {
  const data = ontologySpaceManagementDetailMock.find((item) => item.spaceId === "navy");
  assert.equal(data.counts.object, 22);
  assert.equal(data.counts.relation, 48);
  assert.equal(data.counts.behavior, 15);
  assert.equal(
    ontologySpaceManagementDetailMock.find((item) => item.spaceId === "missing"),
    undefined,
  );
});

test("space overview loader does not fall back to mock data on failure", () => {
  const source = readFileSync(new URL("../src/views/SpaceOverviewPanel/composables/useSpaceOverview.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /ontologySpaceManagementDetailMock/);
  assert.match(source, /getOntologySpaceStatisticInterface/);
  assert.match(source, /空间统计加载失败/);
});
test("overview stat cards use a tinted background for each resource tone", () => {
  const source = readFileSync(new URL("../src/views/SpaceOverviewPanel/index.vue", import.meta.url), "utf8");
  assert.match(source, /linear-gradient\(135deg, var\(--aircas-color-panel-background\), var\(--aircas-color-panel-background-deep\)\)/);
  assert.match(
    source,
    /:root:not\(\.dark\) \.space-overview-panel[\s\S]*linear-gradient\(135deg, var\(--aircas-color-card-background\), var\(--aircas-color-panel-background-deep\)\)/,
  );
  assert.match(source, /radial-gradient\(circle at 100% 0, var\(--stat-glow\), transparent 64%\)/);
  assert.match(source, /space-overview-panel__stat--cyan[\s\S]*--aircas-color-effect-primary-soft/);
  assert.match(source, /space-overview-panel__stat--purple[\s\S]*--aircas-color-effect-purple-soft/);
  assert.match(source, /space-overview-panel__stat--blue[\s\S]*--aircas-color-effect-blue-soft/);
  assert.match(source, /space-overview-panel__stat--green[\s\S]*--aircas-color-effect-success-soft/);
  assert.match(source, /space-overview-panel__stat--orange[\s\S]*--aircas-color-effect-warning-soft/);
});

test("overview distinguishes zero, loading and absent data", () => {
  assert.deepEqual(formatOverviewStat(0, false), { value: "0", note: "当前空间总量" });
  assert.deepEqual(formatOverviewStat(undefined, true), { value: "—", note: "正在统计" });
  assert.deepEqual(formatOverviewStat(undefined, false), { value: "—", note: "暂无统计数据" });
});
