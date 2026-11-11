import assert from "node:assert/strict";
import test from "node:test";
import { buildBehaviorScheduleCreateParams } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/buildBehaviorScheduleCreateParams.ts";

const draft = {
  name: "schedule",
  description: "description",
  strategy: "周期调度",
  periodKind: "每天",
  executeTime: "08:03:30",
  weekdays: [],
  monthDay: null,
  cronExpression: "",
  behaviorActionApi: "ship",
};
const request = { ontologySpaceId: "1", actionApi: "ship", params: { count: 0, enabled: false }, entityPrimaryKeys: { from: ["a"], to: ["b"] } };

test("schedule creates exact envelope and serializes complete behavior request", () => {
  const result = buildBehaviorScheduleCreateParams(draft, "ontology", request);
  assert.equal(result.ok, true);
  assert.deepEqual(result.request, {
    ontologyIdentifier: "ontology",
    actionApi: "ship",
    name: "schedule",
    description: "description",
    type: "TASK",
    task: { periodType: "DAILY", taskCronExpression: "30 3 8 * * ? *", entityJson: JSON.stringify(request) },
  });
});

test("schedule converts daily weekly monthly and manual cron", () => {
  for (const [values, expected] of [
    [{ periodKind: "每周", weekdays: ["周一", "周日"] }, "30 3 8 ? * MON,SUN *"],
    [{ periodKind: "每月", monthDay: 31 }, "30 3 8 31 * ? *"],
    [{ periodKind: "Cron", cronExpression: "30 * * 1/1 * ? *" }, "30 * * 1/1 * ? *"],
    [{ periodKind: "Cron", cronExpression: "0 8 * * *" }, "0 0 8 * * ? *"],
    [{ periodKind: "Cron", cronExpression: "0 0 8 ? * MON" }, "0 0 8 ? * MON *"],
  ]) {
    const result = buildBehaviorScheduleCreateParams({ ...draft, ...values }, "ontology", request);
    assert.equal(result.ok, true);
    assert.equal(result.request.task.taskCronExpression, expected);
    assert.equal(result.request.task.periodType, { 每天: "DAILY", 每周: "WEEKLY", 每月: "MONTHLY", Cron: "CRON" }[values.periodKind]);
  }
});

test("schedule blocks invalid context and cycle without creating payload", () => {
  for (const values of [
    { executeTime: "25:00:00" },
    { periodKind: "每周" },
    { periodKind: "每月", monthDay: 0 },
    { periodKind: "Cron", cronExpression: "bad" },
    { periodKind: "Cron", cronExpression: "0 80 * * * ?" },
  ]) {
    assert.equal(buildBehaviorScheduleCreateParams({ ...draft, ...values }, "ontology", request).ok, false);
  }

  assert.equal(buildBehaviorScheduleCreateParams(draft, "ontology", { ...request, actionApi: "other" }).ok, false);
});

test("manual cron preserves Quartz specials and translates Unix weekday numbering", () => {
  for (const [expression, expected] of [
    ["0 8 * * 0,7", "0 0 8 ? * SUN *"],
    ["0 8 * * 1-5/2", "0 0 8 ? * MON,WED,FRI *"],
    ["0 8 * * 1/2", "0 0 8 ? * MON,WED,FRI,SUN *"],
    [" 0 0 8 L JAN ? ", "0 0 8 L JAN ? *"],
    ["0 0 8 ? * MON#2", "0 0 8 ? * MON#2 *"],
    ["0 0 8 * * *", "0 0 8 * * ? *"],
  ]) {
    const result = buildBehaviorScheduleCreateParams({ ...draft, periodKind: "Cron", cronExpression: expression }, "ontology", request);
    assert.equal(result.ok, true, expression);
    assert.equal(result.request.task.taskCronExpression, expected);
  }
  for (const expression of [
    "0 8 2 * 1",
    "0 8 * * 8",
    "0 0 24 * * ?",
    "0 0 8 32 * ?",
    "0 0 8 ? * 8",
    "0 0 8 ? * ?",
    "0 0 8 * * MON",
    "0/0 0 8 * * ?",
    "0/60 0 8 * * ?",
    "0/a 0 8 * * ?",
    "0/1/2 0 8 * * ?",
    "0 0 8 ? 13 MON",
    "0 0 8 ? * MON 1900",
    "0 0 8 ? * 5-2",
    "0 0 8 ? * MON#6",
  ]) {
    assert.equal(buildBehaviorScheduleCreateParams({ ...draft, periodKind: "Cron", cronExpression: expression }, "ontology", request).ok, false, expression);
  }
  assert.equal(buildBehaviorScheduleCreateParams({ ...draft, executeTime: "bad" }, "ontology", request).ok, false);
  assert.equal(buildBehaviorScheduleCreateParams({ ...draft, name: " " }, "ontology", request).ok, false);
});

test("schedule omits empty ontology identifiers and trims provided identifiers", () => {
  for (const identifier of ["", "   "]) {
    const result = buildBehaviorScheduleCreateParams(draft, identifier, request);
    assert.equal(result.ok, true);
    assert.equal(Object.hasOwn(result.request, "ontologyIdentifier"), false);
    assert.deepEqual(JSON.parse(result.request.task.entityJson), request);
  }
  assert.equal(buildBehaviorScheduleCreateParams(draft, " ontology ", request).request.ontologyIdentifier, "ontology");
});
