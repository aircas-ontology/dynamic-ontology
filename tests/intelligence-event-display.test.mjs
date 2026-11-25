import assert from "node:assert/strict";
import test from "node:test";
import { buildTimelineTicks, getTimelineProgress } from "../src/views/IntelligenceEventDisplay/utils/eventDisplayTimeline.ts";
import { eventDisplayEvents, eventDisplayTargets } from "../src/mocks/intelligenceEventDisplayMock/intelligenceEventDisplayMock.ts";

test("timeline ticks cover start, daily midnights and end", () => {
  const ticks = buildTimelineTicks("2026-09-20 06:00", "2026-09-24 18:00");
  assert.deepEqual(
    ticks.map((tick) => tick.label),
    ["09-20 06:00", "09-21 00:00", "09-22 00:00", "09-23 00:00", "09-24 00:00", "09-24 18:00"],
  );
  assert.equal(ticks[0].progress, 0);
  assert.equal(ticks[ticks.length - 1].progress, 100);
});

test("same-day timeline only contains start and end", () => {
  const ticks = buildTimelineTicks("2026-09-20 06:00", "2026-09-20 18:00");
  assert.deepEqual(
    ticks.map((tick) => tick.label),
    ["09-20 06:00", "09-20 18:00"],
  );
});

test("timeline progress clamps to the window", () => {
  const start = "2026-09-20 06:00";
  const end = "2026-09-24 18:00";
  assert.equal(getTimelineProgress(start, end, start), 0);
  assert.equal(getTimelineProgress(start, end, end), 100);
  assert.ok(Math.abs(getTimelineProgress(start, end, "2026-09-22 12:00") - 50) < 0.001);
  assert.equal(getTimelineProgress(start, end, "2026-09-10 00:00"), 0);
});

test("event display mock matches prototype counts", () => {
  assert.equal(eventDisplayTargets.filter((target) => target.country === "美国").length, 10);
  assert.equal(eventDisplayTargets.filter((target) => target.country === "日本").length, 3);
  assert.equal(eventDisplayEvents.length, 7);
});
