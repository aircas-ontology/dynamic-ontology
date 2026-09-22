import test from "node:test";
import assert from "node:assert/strict";
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
test("overview distinguishes zero, loading and absent data", () => {
  assert.deepEqual(formatOverviewStat(0, false), { value: "0", note: "当前空间总量" });
  assert.deepEqual(formatOverviewStat(undefined, true), { value: "—", note: "正在统计" });
  assert.deepEqual(formatOverviewStat(undefined, false), { value: "—", note: "暂无统计数据" });
});
