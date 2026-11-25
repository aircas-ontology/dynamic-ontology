import test from "node:test";
import assert from "node:assert/strict";
import { buildReplaySchedule } from "../src/views/IntelligenceTaskDisplay/utils/eventReplay.ts";

test("replay sorts Shanghai event times and excludes invalid or unbound events", () => {
  const targets = [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
  ];
  const events = [
    { id: "later", time: "2026-08-06 12:00", targets: [{ name: "A" }, { name: "B" }] },
    { id: "first", time: "2026-08-05 12:00", targets: [{ name: "A" }] },
    { id: "invalid", time: "bad", targets: [{ name: "A" }] },
    { id: "unbound", time: "2026-08-05 12:00", targets: [{ name: "missing" }] },
  ];
  const schedule = buildReplaySchedule(events, targets);
  assert.deepEqual(
    schedule.map((item) => item.event.id),
    ["first", "later"],
  );
  assert.deepEqual(schedule[1].targetIds, ["a", "b"]);
  assert.equal(schedule[0].start, Date.parse("2026-08-05T12:00:00+08:00"));
  assert.equal(schedule[0].end, schedule[1].start);
  assert.ok(schedule[1].end > schedule[1].start);
  assert.deepEqual(buildReplaySchedule([], targets), []);
});
