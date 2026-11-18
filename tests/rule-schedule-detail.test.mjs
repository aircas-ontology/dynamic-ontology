import assert from "node:assert/strict";
import test from "node:test";
import { buildSavedActionEntityJson, restoreRuleScheduleDetail } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/restoreRuleScheduleDetail.ts";

const operand = (value) => ({ type: "fixed", fixValue: value });
const item = (name, extra = {}) => ({ leftOperate: operand(name), rightOperate: operand("1"), condition: "EQ", ...extra });
const action = (value) => ({
  action_api: "app",
  ontology_identifier: "obj",
  entity_json: JSON.stringify({ ontologySpaceId: 156, actionApi: "app", params: { count: value } }),
});
const options = [{ id: "a", actionApi: "app", displayName: "行为", ontologyUniqIdentifier: "obj", kind: "application" }];
const rule = (condition, judgeParams, value) => ({ condition, judgeParams, actionParam: action(value) });

test("restores grouped conditions, if/else and multiple actions with full saved parameters", () => {
  const items = [
    item("A", { linkFlag: "AND" }),
    item("B", { isLeft: 2, linkFlag: "AND" }),
    item("C", { isRight: 1, linkFlag: "OR" }),
    item("D", { isLeft: 1, linkFlag: "AND" }),
    item("E", { isRight: 2 }),
  ];
  const result = restoreRuleScheduleDetail({ judgeRules: [rule(false, items, 1), rule(false, items, 2), rule(true, items, 3)] }, options);
  assert.equal(result.ok, true);
  assert.equal(result.groups.length, 1);
  const branch = result.groups[0].flow.steps[0];
  assert.equal(branch.condition.logic, "and");
  assert.equal(branch.condition.children[1].logic, "or");
  assert.equal(branch.condition.children[1].children[0].logic, "and");
  assert.equal(branch.then[0].actions.length, 2);
  assert.equal(branch.otherwise[0].actions.length, 1);
  assert.equal(branch.then[0].actions[0].behaviorName, "行为");
  assert.equal(JSON.parse(result.groups[0].actionDetails[branch.then[0].actions[0].id].entityJson).params.count, 1);
});

test("independent predicates remain separate and missing behavior uses saved API", () => {
  const result = restoreRuleScheduleDetail({ judgeRules: [rule(false, [item("A")], 1), rule(true, [item("B")], 2)] }, []);
  assert.equal(result.ok, true);
  assert.equal(result.groups.length, 2);
  assert.equal(result.groups[1].flow.steps[0].otherwise[0].actions[0].behaviorName, "app");
});

test("restores dynamic operands and honors AND priority", () => {
  const variable = { type: "dynamic", OntologyId: "plane", entityId: "3", propertyId: "prop", propertyName: "longitude" };
  const result = restoreRuleScheduleDetail(
    { judgeRules: [rule(false, [item("A", { leftOperate: variable, linkFlag: "OR" }), item("B", { linkFlag: "AND" }), item("C")], 1)] },
    options,
  );
  assert.equal(result.ok, true);
  const root = result.groups[0].flow.steps[0].condition;
  assert.equal(root.logic, "or");
  assert.equal(root.children[0].left.objectId, "plane");
  assert.deepEqual(root.children[0].left.instanceIds, ["3"]);
  assert.equal(root.children[1].logic, "and");
});

test("rejects missing data, invalid parentheses, unknown operators and invalid action JSON", () => {
  const good = rule(false, [item("A")], 1);
  for (const payload of [
    null,
    {},
    { judgeRules: [] },
    { judgeRules: [rule(false, [item("A", { isLeft: 1 })], 1)] },
    { judgeRules: [rule(false, [item("A", { condition: "CH" })], 1)] },
    { judgeRules: [{ ...good, actionParam: { ...good.actionParam, entity_json: "{" } }] },
  ]) {
    const result = restoreRuleScheduleDetail(payload, options);
    assert.equal(result.ok, false);
    assert.ok(result.error);
  }
});

test("restores legacy bracket flags and a property-name-only variable", () => {
  const variable = { type: "dynamic", OntologyId: "plane", entityId: "0", propertyName: "longitude" };
  const result = restoreRuleScheduleDetail(
    { judgeRules: [rule(false, [item("A", { leftOperate: variable, isLeft: true, linkFlag: "OR" }), item("B", { isRight: true })], 1)] },
    options,
  );
  assert.equal(result.ok, true);
  const condition = result.groups[0].flow.steps[0].condition;
  assert.equal(condition.logic, "or");
  assert.equal(condition.children[0].left.propertyName, "longitude");
});

test("rejects invalid operand, missing conjunction and invalid trailing conjunction", () => {
  const badItems = [
    [item("A", { leftOperate: { type: "fixed" } })],
    [item("A", { leftOperate: { type: "dynamic", OntologyId: "plane", entityId: "1" } })],
    [item("A", { isLeft: -1 })],
    [item("A", { isRight: 1 })],
    [item("A"), item("B")],
    [item("A", { linkFlag: "AND" })],
  ];
  for (const items of badItems) assert.equal(restoreRuleScheduleDetail({ judgeRules: [rule(false, items, 1)] }, options).ok, false);
});

test("retains optional target instance and allows missing serialized parameters", () => {
  const actionParam = { action_api: "app", entity_identifiler: "42" };
  const result = restoreRuleScheduleDetail({ judgeRules: [{ condition: false, judgeParams: [item("A")], actionParam }] }, options);
  assert.equal(result.ok, true);
  assert.equal(Object.values(result.groups[0].actionDetails)[0].entityId, "42");
  assert.equal(Object.values(result.groups[0].actionDetails)[0].entityJson, "");
  assert.equal(JSON.parse(buildSavedActionEntityJson(Object.values(result.groups[0].actionDetails)[0])).entityPrimaryKey, "42");
  assert.equal(
    JSON.parse(buildSavedActionEntityJson({ ...Object.values(result.groups[0].actionDetails)[0], entityJson: '{"entityPrimaryKey":1}' })).entityPrimaryKey,
    1,
  );
});
