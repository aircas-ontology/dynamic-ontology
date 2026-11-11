import assert from "node:assert/strict";
import test from "node:test";
import { restoreSchedulePeriod } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/restoreSchedulePeriod.ts";
import { buildBehaviorScheduleCreateParams } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/buildBehaviorScheduleCreateParams.ts";

const cases = [
  ["DAILY", "30 3 8 * * ? *", "每天", "08:03:30", [], null],
  ["WEEKLY", "0 5 9 ? * MON,SUN *", "每周", "09:05:00", ["周一", "周日"], null],
  ["MONTHLY", "0 0 10 31 * ? *", "每月", "10:00:00", [], 31],
  ["CRON", "30 * * 1/1 * ? *", "Cron", "", [], null],
];

test("period type restores all four configurations and round trips API enums", () => {
  for (const [type, cron, kind, time, weekdays, monthDay] of cases) {
    const restored = restoreSchedulePeriod(type, cron);
    assert.deepEqual(restored, { periodKind: kind, executeTime: time, weekdays, monthDay, cronExpression: cron });
    const result = buildBehaviorScheduleCreateParams({ ...restored, name: "schedule", description: "", behaviorActionApi: "app" }, "", {
      ontologySpaceId: "156",
      actionApi: "app",
    });
    assert.equal(result.ok, true);
    assert.equal(result.request.task.periodType, type);
    assert.equal(result.request.task.taskCronExpression, cron);
  }
});

test("period restore handles six fields, numeric Quartz weekdays and historic values", () => {
  assert.equal(restoreSchedulePeriod("每天", "0 0 8 * * ?").executeTime, "08:00:00");
  assert.deepEqual(restoreSchedulePeriod("WEEKLY", "0 0 8 ? * 2,1,2 *").weekdays, ["周一", "周日"]);
  assert.equal(restoreSchedulePeriod("每月", "0 0 8 15 * ? *").monthDay, 15);
  assert.equal(restoreSchedulePeriod("DAILY", "0 0 8 1/1 * ? *").periodKind, "每天");
});

test("unknown or incompatible schedules preserve original Cron without losing constraints", () => {
  for (const [type, expression] of [
    [undefined, "0 0 8 * * ? *"],
    ["UNKNOWN", "0 0 8 * * ? *"],
    ["DAILY", "bad"],
    ["DAILY", "0 0 8 * JAN ? *"],
    ["DAILY", "0 0 8 * * ? 2027"],
    ["DAILY", "0 0 8 12 * ? *"],
    ["DAILY", "0/5 0 8 * * ? *"],
    ["MONTHLY", "0 0 8 L * ? *"],
    ["MONTHLY", "0 0 8 0 * ? *"],
    ["WEEKLY", "0 0 8 ? * MON-FRI *"],
    ["DAILY", "0 0 24 * * ? *"],
    ["DAILY", "60 0 8 * * ? *"],
    ["DAILY", "0 60 8 * * ? *"],
    ["DAILY", "0 0 8 * * * *"],
    ["DAILY", "0 0 8 * * ? * extra"],
  ]) {
    const restored = restoreSchedulePeriod(type, expression);
    assert.equal(restored.periodKind, "Cron");
    assert.equal(restored.cronExpression, expression);
  }
});
