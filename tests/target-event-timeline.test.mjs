import test from "node:test";
import assert from "node:assert/strict";
import { getTargetEvents, groupEventsByTime } from "../src/views/IntelligenceTaskDisplay/utils/targetEvents.ts";

test("target events match the selected target and sort without mutating the input", () => {
  const events = [
    { id: "later", time: "2026-08-06 12:00", targets: [{ name: "A" }] },
    { id: "other", time: "2026-08-04 12:00", targets: [{ name: "B" }] },
    { id: "first", time: "2026-08-05 12:00", targets: [{ name: "A" }, { name: "B" }] },
  ];
  assert.deepEqual(
    getTargetEvents(events, "A").map((event) => event.id),
    ["first", "later"],
  );
  assert.deepEqual(
    events.map((event) => event.id),
    ["later", "other", "first"],
  );
  assert.deepEqual(getTargetEvents(events, "missing"), []);
  assert.deepEqual(getTargetEvents(events, ""), []);
});

test("events sharing a time use one chronological timeline group", () => {
  const events = [
    { id: "b", time: "2026-08-06 12:00" },
    { id: "a", time: "2026-08-05 12:00" },
    { id: "c", time: "2026-08-05 12:00" },
  ];
  assert.deepEqual(
    groupEventsByTime(events).map((group) => [group.time, group.events.map((event) => event.id)]),
    [
      ["2026-08-05 12:00", ["a", "c"]],
      ["2026-08-06 12:00", ["b"]],
    ],
  );
  assert.deepEqual(groupEventsByTime([]), []);
});
