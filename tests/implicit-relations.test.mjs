import assert from "node:assert/strict";
import test from "node:test";
import { implicitRelationTasks } from "../src/mocks/implicitRelationsMock/implicitRelationsMock.ts";
import { summarizeImplicitRelations } from "../src/views/IntelligenceHiddenRelationMining/utils/implicitRelationSummary.ts";

test("summary covers five prototype cards", () => {
  const cards = summarizeImplicitRelations(implicitRelationTasks);
  assert.deepEqual(
    cards.map((card) => card.label),
    ["发现任务", "发现关系", "待校验关系", "已保存关系", "已忽略关系"],
  );
  assert.deepEqual(
    cards.map((card) => card.count),
    [8, 8, 8, 0, 0],
  );
  assert.equal(cards[0].unit, "个");
  assert.equal(cards[1].unit, "条");
});

test("pending count excludes saved and ignored relations", () => {
  assert.equal(summarizeImplicitRelations(implicitRelationTasks, 3, 2)[2].count, 3);
  assert.equal(summarizeImplicitRelations(implicitRelationTasks, 10, 0)[2].count, 0);
});

test("task rows keep prototype hops and progress", () => {
  assert.equal(implicitRelationTasks.length, 8);
  assert.deepEqual(implicitRelationTasks[5].hops, [1, 3, 5]);
  assert.equal(implicitRelationTasks[5].progress, "未发现");
});
