import assert from "node:assert/strict";
import test from "node:test";
import { fetchScheduleBehaviorOptions } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/fetchScheduleBehaviorOptions.ts";

test("loads every page with 1000 records and excludes base behaviors", async () => {
  const queries = [];
  const result = await fetchScheduleBehaviorOptions(23, async (query) => {
    queries.push(query);
    return {
      code: 200,
      data: {
        pages: 2,
        records:
          query.pageNum === 1
            ? [
                { status: 1, actionKind: "BASE", displayName: "base", actionApi: "base" },
                { id: 3, status: 2, actionKind: "APPLICATION", displayName: "draft", actionApi: "draft" },
                { id: 4, status: 0, actionKind: "APPLICATION", displayName: "inactive", actionApi: "inactive" },
                { id: 1, status: 1, actionKind: "APPLICATION", displayName: "app", actionApi: "app", ontologyUniqIdentifier: "ship" },
              ]
            : [{ id: 2, status: 1, actionKind: "APPLICATION", displayName: "app", actionApi: "second", ontologyUniqIdentifier: "ship" }],
      },
    };
  });
  assert.deepEqual(result, [
    { id: "1", displayName: "app", actionApi: "app", ontologyUniqIdentifier: "ship" },
    { id: "2", displayName: "app", actionApi: "second", ontologyUniqIdentifier: "ship" },
  ]);
  assert.deepEqual(queries, [
    { ontologySpaceId: 23, pageNum: 1, pageSize: 1000, status: 1 },
    { ontologySpaceId: 23, pageNum: 2, pageSize: 1000, status: 1 },
  ]);
});

test("returns empty and propagates server and network errors", async () => {
  assert.deepEqual(await fetchScheduleBehaviorOptions(1, async () => ({ code: 0, data: { pages: 0, records: [] } })), []);
  await assert.rejects(
    fetchScheduleBehaviorOptions(1, async () => ({ code: 500, message: "failed" })),
    /failed/,
  );
  await assert.rejects(
    fetchScheduleBehaviorOptions(1, async () => {
      throw new Error("offline");
    }),
    /offline/,
  );
});
