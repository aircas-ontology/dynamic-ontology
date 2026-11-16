import assert from "node:assert/strict";
import test from "node:test";
import { restoreRuleFlowDocument } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/restoreRuleFlowDocument.ts";

const value = (text) => ({ kind: "input", text });
const action = (id) => ({
  id,
  behaviorId: "a",
  behaviorName: "行为",
  relatedObject: "object",
  instanceIds: [],
  params: [],
  behaviorParameters: { request: { ontologySpaceId: "156", actionApi: "app", params: { value: 2 } } },
});
const actions = (id) => [{ kind: "actions", id: `step-${id}`, actions: [action(id)] }];
const branch = {
  kind: "branch",
  id: "if",
  condition: { id: "root", type: "composite", logic: "and", children: [{ id: "c", type: "leaf", left: value("1"), right: value("2"), operator: "lt" }] },
  then: actions("a1"),
  otherwise: actions("a2"),
};
const switchStep = {
  kind: "switch",
  id: "switch",
  switchOn: value("2"),
  cases: [
    { id: "case1", label: "case 1", value: value("1"), steps: actions("a1") },
    { id: "case2", label: "case 2", value: value("2"), steps: actions("a2") },
  ],
  defaultSteps: actions("default"),
};

test("restores switch, case, default and saved behavior parameters in the original layout structure", () => {
  const result = restoreRuleFlowDocument(JSON.stringify({ version: 1, steps: [switchStep] }));
  assert.equal(result.ok, true);
  assert.equal(result.group.flow.steps[0].kind, "switch");
  assert.deepEqual(
    result.group.flow.steps[0].cases.map((entry) => entry.label),
    ["case 1", "case 2"],
  );
  assert.equal(result.group.flow.steps[0].defaultSteps[0].actions[0].behaviorName, "行为");
  assert.equal(JSON.parse(result.group.actionDetails.a1.entityJson).params.value, 2);
});
test("restores nested branches and preserves selected variable names and instances", () => {
  const nested = structuredClone(branch);
  nested.condition.children[0].left = {
    kind: "variable",
    objectId: "o",
    objectName: "飞机",
    objectKind: "object",
    propertyId: "p",
    propertyName: "经度",
    instanceIds: ["5"],
  };
  nested.then = [switchStep];
  const result = restoreRuleFlowDocument(JSON.stringify({ version: 1, steps: [nested] }));
  assert.equal(result.ok, true);
  assert.equal(result.group.flow.steps[0].condition.children[0].left.objectName, "飞机");
  assert.equal(result.group.flow.steps[0].then[0].kind, "switch");
});
test("rejects malformed, unknown version, invalid structure and missing behavior parameters", () => {
  for (const payload of [
    "{",
    "{}",
    JSON.stringify({ version: 2, steps: [] }),
    JSON.stringify({ version: 1, steps: [{ kind: "unknown" }] }),
    JSON.stringify({ version: 1, steps: [{ ...branch, then: [{ kind: "actions", id: "bad", actions: [{ ...action("bad"), behaviorParameters: null }] }] }] }),
  ]) {
    const result = restoreRuleFlowDocument(payload);
    assert.equal(result.ok, false);
    assert.ok(result.error);
  }
});
