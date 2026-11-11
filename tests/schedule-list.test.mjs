import assert from "node:assert/strict";
import test from "node:test";
import { fetchBehaviorSchedules } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/fetchBehaviorSchedules.ts";

const record = {
  id: 123,
  ontologyName: "Ship",
  ontologyIdentifier: "ship",
  actionApi: "app",
  actionName: "Action",
  schedulingName: "Daily",
  description: "description",
  type: "TASK",
  status: "START",
};

test("schedule list requests a single filtered page and maps records and total", async () => {
  const calls = [];
  const params = { pageNum: 2, pageSize: 20, name: "daily", type: "TASK" };
  const result = await fetchBehaviorSchedules(
    async (query) => {
      calls.push(query);
      return { code: 200, data: { records: [record], total: 55, size: 20, current: 2 } };
    },
    () => true,
    params,
  );
  assert.deepEqual(calls, [params]);
  assert.equal(result.total, 55);
  assert.equal(result.records[0].name, "Daily");
  assert.equal(result.records[0].strategy, "周期调度");
  assert.equal(result.records[0].detailsAvailable, false);
  assert.equal(result.records[0].status, "START");
});

test("schedule list defaults to ten and supports empty pages", async () => {
  const result = await fetchBehaviorSchedules(async (params) => {
    assert.deepEqual(params, { pageNum: 1, pageSize: 10 });
    return { code: 0, data: { records: [], total: 0, size: 10, current: 1 } };
  });
  assert.deepEqual(result, { records: [], total: 0 });
  const page = await fetchBehaviorSchedules(async () => ({
    code: 200,
    data: { records: [{ ...record, ontologyName: undefined, type: "RULE" }], total: 1, size: 10, current: 1 },
  }));
  assert.equal(page.records[0].target, "-");
  assert.equal(page.records[0].strategy, "规则调度");
});

test("schedule list rejects server, network, missing payload and invalid pagination", async () => {
  for (const response of [
    { code: 500, message: "列表失败" },
    { code: 200, success: false, message: "拒绝" },
    { code: 200 },
    { code: 200, data: { records: [], total: 2, size: 0, current: 1 } },
  ]) {
    await assert.rejects(fetchBehaviorSchedules(async () => response));
  }
  await assert.rejects(
    fetchBehaviorSchedules(async () => {
      throw new Error("network");
    }),
    /network/,
  );
});

test("schedule list stops pagination for a stale session", async () => {
  let active = true;
  let calls = 0;
  const result = await fetchBehaviorSchedules(
    async () => {
      calls += 1;
      active = false;
      return { code: 200, data: { records: [record], total: 2, size: 1, current: 1 } };
    },
    () => active,
  );
  assert.equal(calls, 1);
  assert.equal(result, null);
  assert.deepEqual(
    await fetchBehaviorSchedules(
      async () => {
        throw new Error("must not query");
      },
      () => false,
    ),
    null,
  );
});

test("schedule list rejects invalid pagination and allows empty out-of-range pages", async () => {
  for (const data of [
    { records: [], total: 1, size: 10, current: 2 },
    { records: null, total: 0, size: 10, current: 1 },
    { records: [], total: -1, size: 10, current: 1 },
  ])
    await assert.rejects(fetchBehaviorSchedules(async () => ({ code: 200, data })));
  assert.deepEqual(
    await fetchBehaviorSchedules(
      async () => ({ code: 200, data: { records: [], total: 2, size: 10, current: 3 } }),
      () => true,
      { pageNum: 3, pageSize: 10 },
    ),
    { records: [], total: 2 },
  );
});

test("schedule creation time uses createTime and falls back only for absent values", async () => {
  for (const [createTime, expected] of [
    ["2026-11-11 19:00:00", "2026-11-11 19:00:00"],
    ["2026-11-11T11:00:00Z", "2026-11-11T11:00:00Z"],
    [undefined, "-"],
    [null, "-"],
    ["", "-"],
    ["   ", "-"],
  ]) {
    const result = await fetchBehaviorSchedules(async () => ({ code: 200, data: { records: [{ ...record, createTime }], total: 1, size: 10, current: 1 } }));
    assert.equal(result.records[0].createdAt, expected);
  }
});
