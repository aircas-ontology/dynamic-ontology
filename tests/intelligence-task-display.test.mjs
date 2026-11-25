import test from "node:test";
import { buildReplaySchedule } from "../src/views/IntelligenceTaskDisplay/utils/eventReplay.ts";
import assert from "node:assert/strict";
import { groupTaskTargets, findTaskTarget } from "../src/views/IntelligenceTaskDisplay/utils/taskTargets.ts";
import { createTargetMenuController } from "../src/views/IntelligenceTaskDisplay/utils/targetMenu.ts";
import { buildTargetCategoryItems, collectCategoryOntologyIdentifiers } from "../src/views/IntelligenceTaskDisplay/utils/targetCategoryInstances.ts";
import { parseTaskRegionPoints } from "../src/views/IntelligenceTaskDisplay/utils/taskRegion.ts";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { ref, computed, nextTick, onBeforeUnmount, onMounted, watch } from "vue";

test("event detail opens selected event and navigates within bounds", () => {
  const source = readFileSync(new URL("../src/views/IntelligenceTaskDisplay/index.vue", import.meta.url), "utf8");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const code = ts.transpile(script + "\nreturn { openEventDetail, moveEventDetail, closeEventDetail, currentEvent, eventIndex, eventDetails };", {
    target: ts.ScriptTarget.ES2022,
  });
  const phases = [
    {
      events: [
        { id: "first", name: "一", time: "2026-08-05 12:00", targets: [] },
        { id: "second", name: "二", time: "2026-08-06 12:00", targets: [] },
      ],
    },
  ];
  const state = new Function(
    "computed",
    "ref",
    "nextTick",
    "onBeforeUnmount",
    "onMounted",
    "watch",
    "useRoute",
    "useRouter",
    "taskDisplayEvents",
    "taskDisplayTargets",
    "TaskDisplayMap",
    "groupTaskTargets",
    "buildReplaySchedule",
    code,
  )(
    computed,
    ref,
    nextTick,
    onBeforeUnmount,
    onMounted,
    watch,
    () => ({ query: {} }),
    () => ({}),
    phases,
    [],
    {},
    () => [],
    buildReplaySchedule,
  );
  state.openEventDetail("second");
  assert.equal(state.currentEvent.value.name, "二");
  state.moveEventDetail(1);
  assert.equal(state.eventIndex.value, 1);
  state.moveEventDetail(-1);
  assert.equal(state.currentEvent.value.name, "一");
  state.moveEventDetail(-1);
  assert.equal(state.eventIndex.value, 0);
  state.closeEventDetail();
  assert.equal(state.currentEvent.value, undefined);
});

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

test("target category instance helpers collect descendants without duplicates and map query records", () => {
  const identifiers = collectCategoryOntologyIdentifiers({
    categoryId: 1,
    ontologyMetaInfos: [{ uniqueIdentifier: "aircraft" }],
    children: [{ categoryId: 2, ontologyMetaInfos: [{ uniqueIdentifier: "ship" }, { uniqueIdentifier: "aircraft" }] }, { categoryId: 3 }],
  });
  assert.deepEqual(identifiers, ["aircraft", "ship"]);

  assert.deepEqual(
    buildTargetCategoryItems([
      {
        ontologyUniqueIdentifier: "aircraft",
        entityList: [{ ontologyUniqueIdentifier: "aircraft", ontologyName: "飞机", primaryKey: 18, displayName: "巡逻机 A", properties: [] }],
      },
      {
        ontologyUniqueIdentifier: "ship",
        entityList: [{ ontologyUniqueIdentifier: "ship", ontologyName: "舰艇", primaryKey: "S-01", displayName: "", properties: [] }],
      },
    ]),
    [
      { id: "aircraft:18", name: "巡逻机 A" },
      { id: "ship:S-01", name: "舰艇 S-01" },
    ],
  );
});

test("task region parser rejects empty, invalid, and incomplete polygon data", () => {
  assert.deepEqual(parseTaskRegionPoints("120.1,30.2;120.3,30.4;120.5,30.6"), [
    [120.1, 30.2],
    [120.3, 30.4],
    [120.5, 30.6],
  ]);
  assert.deepEqual(parseTaskRegionPoints(""), []);
  assert.deepEqual(parseTaskRegionPoints("120.1,30.2;invalid;120.5,30.6"), []);
});
