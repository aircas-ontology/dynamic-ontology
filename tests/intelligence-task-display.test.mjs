import test from "node:test";
import assert from "node:assert/strict";
import { groupTaskTargets, findTaskTarget } from "../src/views/IntelligenceTaskDisplay/utils/taskTargets.ts";
import { createTargetMenuController } from "../src/views/IntelligenceTaskDisplay/utils/targetMenu.ts";

test("map menu replaces its anchored graphic and disposes it when closed", () => {
  const actions = [];
  const controller = createTargetMenuController((target) => {
    actions.push(["add", target.id, target.longitude, target.latitude]);
    return () => actions.push(["remove", target.id]);
  });
  controller.show({ id: "a", longitude: 121, latitude: 24 });
  controller.show({ id: "b", longitude: 120, latitude: 23 });
  controller.clear();
  controller.clear();
  assert.deepEqual(actions, [
    ["add", "a", 121, 24],
    ["remove", "a"],
    ["add", "b", 120, 23],
    ["remove", "b"],
  ]);
});

test("target groups and lookup preserve coordinates for map navigation", () => {
  const targets = [
    { id: "a", category: "陆上目标", longitude: 121, latitude: 24 },
    { id: "b", category: "空中目标", longitude: 120, latitude: 23 },
    { id: "c", category: "陆上目标", longitude: 122, latitude: 25 },
  ];
  assert.deepEqual(
    groupTaskTargets(targets).map((group) => [group.name, group.items.length]),
    [
      ["陆上目标", 2],
      ["空中目标", 1],
    ],
  );
  assert.equal(findTaskTarget(targets, "b")?.longitude, 120);
  assert.equal(findTaskTarget(targets, "missing"), undefined);
});
