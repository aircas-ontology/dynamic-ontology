import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ontologySpaceManagementDetailMock } from "../src/mocks/ontologySpaceManagementDetailMock/ontologySpaceManagementDetailMock.ts";
import { formatOverviewStat } from "../src/views/OntologySpaceManagementDetail/utils/overviewStats.ts";
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
test("overview stat cards use a tinted background for each resource tone", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/components/SpaceOverviewPanel.vue", import.meta.url), "utf8");
  assert.match(source, /linear-gradient\(135deg, var\(--aircas-color-overlay\), var\(--aircas-color-overlay-deep\)\)/);
  assert.match(source, /radial-gradient\(circle at 100% 0, var\(--stat-glow\), var\(--aircas-color-transparent\) 64%\)/);
  assert.match(source, /space-overview-panel__stat--cyan[\s\S]*--aircas-color-accent-cyan-soft/);
  assert.match(source, /space-overview-panel__stat--purple[\s\S]*--aircas-color-accent-purple-soft/);
  assert.match(source, /space-overview-panel__stat--blue[\s\S]*--aircas-color-accent-blue-soft/);
  assert.match(source, /space-overview-panel__stat--green[\s\S]*--aircas-color-accent-green-soft/);
  assert.match(source, /space-overview-panel__stat--orange[\s\S]*--aircas-color-accent-orange-soft/);
});

test("overview distinguishes zero, loading and absent data", () => {
  assert.deepEqual(formatOverviewStat(0, false), { value: "0", note: "当前空间总量" });
  assert.deepEqual(formatOverviewStat(undefined, true), { value: "—", note: "正在统计" });
  assert.deepEqual(formatOverviewStat(undefined, false), { value: "—", note: "暂无统计数据" });
});
