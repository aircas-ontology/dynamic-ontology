import test from "node:test";
import assert from "node:assert/strict";
import { validateTaskDraft, taskThemeToDraft, updateTaskTheme } from "../src/views/IntelligenceTaskThemes/utils/taskDraft.ts";
import { toggleTaskSelection, removeSelectedTasks } from "../src/views/IntelligenceTaskThemes/utils/taskSelection.ts";

test("editing restores task data and keeps points isolated until saved", () => {
  const task = {
    id: "a",
    title: "任务",
    category: "军事作战",
    region: "东海",
    description: "描述",
    period: "2026-01-01 00:00 ~ 2026-01-02 00:00",
    counts: { target: 1, sea: 0, air: 0, land: 0, event: 0 },
    spaceId: 7,
    points: [[120, 25]],
  };
  const draft = taskThemeToDraft(task);
  assert.equal(draft.spaceId, 7);
  assert.equal(draft.startTime, "2026-01-01 00:00");
  draft.points.push([121, 26]);
  assert.equal(task.points.length, 1);
  assert.equal(updateTaskTheme(task, draft).points.length, 2);
  assert.equal(taskThemeToDraft({ ...task, spaceId: undefined, points: undefined }).spaceId, null);
});

test("task selection toggles and removes only selected cards", () => {
  let selected = toggleTaskSelection([], "a");
  selected = toggleTaskSelection(selected, "b");
  assert.deepEqual(selected, ["a", "b"]);
  selected = toggleTaskSelection(selected, "a");
  assert.deepEqual(selected, ["b"]);
  assert.deepEqual(removeSelectedTasks([{ id: "a" }, { id: "b" }], selected), [{ id: "a" }]);
  assert.deepEqual(removeSelectedTasks([{ id: "a" }], []), [{ id: "a" }]);
});

test("task draft requires task details, a valid time and at least three map points", () => {
  const draft = {
    name: "任务",
    category: "军事作战",
    region: "东海海域",
    description: "描述",
    spaceId: 1,
    startTime: "2026-11-23 10:00:00",
    endTime: "2026-11-23 11:00:00",
    ongoing: false,
    points: [
      [1, 1],
      [2, 2],
      [3, 3],
    ],
  };
  assert.equal(validateTaskDraft(draft), "");
  assert.match(validateTaskDraft({ ...draft, points: [] }), /3/);
  assert.match(validateTaskDraft({ ...draft, endTime: "" }), /时间/);
  assert.equal(validateTaskDraft({ ...draft, endTime: "", ongoing: true }), "");
  assert.match(validateTaskDraft({ ...draft, name: " " }), /名称/);
});
