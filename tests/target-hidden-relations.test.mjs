import test from "node:test";
import assert from "node:assert/strict";
import { buildHiddenRelations } from "../src/views/IntelligenceTaskDisplay/utils/hiddenRelations.ts";

test("hidden relations filter direct and indirect paths by target and category", () => {
  const targets = [
    { id: "a", name: "A", type: "装备A" },
    { id: "b", name: "B", type: "装备B" },
  ];
  const events = [{ id: "e", name: "事件", targets: [{ name: "A" }, { name: "B" }] }];
  assert.deepEqual(
    buildHiddenRelations(targets[0], targets, events, "event", 1).map((item) => [item.sourceName, item.targetName]),
    [["A", "事件"]],
  );
  assert.equal(buildHiddenRelations(targets[0], targets, events, "event", 2).length, 2);
  assert.deepEqual(
    buildHiddenRelations(targets[0], targets, events, "equipment", 1).map((item) => item.targetName),
    ["装备A"],
  );
  assert.equal(buildHiddenRelations(targets[0], targets, events, "entity", 1).length, 0);
  assert.equal(buildHiddenRelations(targets[0], targets, events, "entity", 2).length, 2);
  assert.deepEqual(buildHiddenRelations(undefined, targets, events, "event", 2), []);
});
