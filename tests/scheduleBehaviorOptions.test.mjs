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
                { actionKind: "BASE", displayName: "base" },
                { actionKind: "APPLICATION", displayName: "app" },
              ]
            : [{ actionKind: "APPLICATION", displayName: "second" }],
      },
    };
  });
  assert.deepEqual(result, ["app", "second"]);
  assert.deepEqual(queries, [
    { ontologySpaceId: 23, pageNum: 1, pageSize: 1000 },
    { ontologySpaceId: 23, pageNum: 2, pageSize: 1000 },
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
