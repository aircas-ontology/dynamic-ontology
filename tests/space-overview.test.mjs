import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ontologySpaceManagementDetailMock } from "./fixtures/ontologySpaceManagementDetailMock.ts";
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

test("space overview loader does not fall back to mock data on failure", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/composables/useSpaceOverview.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /ontologySpaceManagementDetailMock/);
  assert.match(source, /getOntologySpaceStatisticInterface/);
  assert.match(source, /空间统计加载失败/);
  assert.match(source, /keepPrevious/);
  assert.match(source, /if \(!options\.keepPrevious\) data\.value = undefined/);
});

test("space overview refresh injection key is shared for layout and child workspaces", () => {
  const source = readFileSync(new URL("../src/composables/shared/useSpaceOverviewRefresh.ts", import.meta.url), "utf8");
  assert.match(source, /export const SPACE_OVERVIEW_REFRESH_KEY/);
  assert.match(source, /export function useSpaceOverviewRefresh/);
  assert.match(source, /inject\(SPACE_OVERVIEW_REFRESH_KEY/);
});

test("overview stat formatting distinguishes zero, loading and absent data", () => {
  assert.deepEqual(formatOverviewStat(0, false), { value: "0", note: "当前空间总量" });
  assert.deepEqual(formatOverviewStat(undefined, true), { value: "—", note: "正在统计" });
  assert.deepEqual(formatOverviewStat(undefined, false), { value: "—", note: "暂无统计数据" });
});

test("space statistic mapping no longer exposes an overview tab", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/composables/useSpaceOverview.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /"overview"/);
  assert.match(source, /const availableTabs: ManagementWorkspaceTab\[\] = \[\];/);
  assert.match(source, /if \(value > 0\) availableTabs\.push\(tab\);/);
});

test("workspace type tabs no longer render a space name tab", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/components/WorkspaceTypeTabs.vue", import.meta.url), "utf8");
  assert.doesNotMatch(source, /id: "overview"/);
  assert.doesNotMatch(source, /spaceName/);
});

test("workspace tab helpers no longer map an overview tab", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/utils/workspaceTabs.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /overview/);
});
