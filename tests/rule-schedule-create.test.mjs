import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { compileScript, parse } from "@vue/compiler-sfc";
import { ModuleKind, transpileModule } from "typescript";
import * as Vue from "vue";
import * as scheduleTypes from "../src/types/pages/ontologySpaceBehaviorScheduleType.ts";
import { buildRuleScheduleCreateParams } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/buildRuleScheduleCreateParams.ts";

const options = [{ id: "action", actionApi: "app", ontologyUniqIdentifier: "ship" }];
/** @description 创建固定值。 @param {string} text 文本。 @returns {object} 固定值。 */
function literal(text) {
  return { kind: "input", text };
}
/** @description 创建有校验快照的行为步骤。 @param {number} value 参数值。 @returns {object} 行为步骤。 */
function actions(value = 55) {
  return {
    kind: "actions",
    id: "actions",
    actions: [
      {
        id: "a",
        behaviorId: "action",
        params: [],
        behaviorParameters: {
          request: { ontologySpaceId: "156", actionApi: "app", params: { longitude: value } },
        },
      },
    ],
  };
}
const leaf = { id: "leaf", type: "leaf", left: literal("100"), right: literal("50"), operator: "gt" };
/** @description 构造规则创建请求。 @param {object[]} steps 步骤。 @param {string} spaceId 空间。 @returns {object} 转换结果。 */
function buildRequest(steps, spaceId = "156") {
  return buildRuleScheduleCreateParams({ name: " rule ", description: "demo", ruleFlow: { steps } }, options, spaceId);
}
/** @description 创建条件分支。 @param {object} condition 条件。 @returns {object} 分支。 */
function branch(condition = { type: "composite", logic: "and", children: [structuredClone(leaf)] }) {
  return { kind: "branch", condition, then: [actions()], otherwise: [actions(66)] };
}
test("if else creates opposite rules and serializes full action parameters without mutating flow", () => {
  const flow = branch();
  const before = structuredClone(flow);
  const result = buildRequest([flow]);
  assert.equal(result.ok, true);
  assert.equal(result.request.type, "RULE");
  assert.equal(result.request.spaceId, 156);
  assert.equal(result.request.actionApi, "app");
  assert.equal(result.request.ontologyIdentifier, "ship");
  assert.equal(result.request.name, "rule");
  assert.deepEqual(JSON.parse(result.request.rule.flowDocument), { version: 1, steps: [flow] });
  const rules = result.request.rule.judgeRules;
  assert.deepEqual(
    rules.map((item) => item.condition),
    [false, true],
  );
  assert.deepEqual(rules[0].judgeParams, [
    { leftOperate: { type: "fixed", fixValue: "100" }, rightOperate: { type: "fixed", fixValue: "50" }, condition: "GT" },
  ]);
  assert.deepEqual(
    rules.map((item) => JSON.parse(item.actionParam.entity_json).params.longitude),
    [55, 66],
  );
  assert.deepEqual(flow, before);
});
test("switch cases use EQ and default negates their OR union", () => {
  const result = buildRequest([
    {
      kind: "switch",
      switchOn: literal("2"),
      cases: [1, 2, 3].map((n) => ({ value: literal(String(n)), steps: [actions(50 + n)] })),
      defaultSteps: [actions(99)],
    },
  ]);
  assert.equal(result.ok, true);
  assert.equal(JSON.parse(result.request.rule.flowDocument).steps[0].kind, "switch");
  const rules = result.request.rule.judgeRules;
  assert.deepEqual(
    rules.map((item) => item.condition),
    [false, false, false, true],
  );
  assert.deepEqual(
    rules[3].judgeParams.map((item) => item.linkFlag),
    ["OR", "OR", undefined],
  );
  assert.ok(rules.flatMap((item) => item.judgeParams).every((item) => item.condition === "EQ"));
});
test("each action in a branch produces a rule with the same predicate", () => {
  const flow = branch();
  flow.then.push(actions(77));
  flow.otherwise = null;
  const result = buildRequest([flow]);
  assert.equal(result.ok, true);
  assert.equal(result.request.rule.judgeRules.length, 2);
  assert.deepEqual(result.request.rule.judgeRules[0].judgeParams, result.request.rule.judgeRules[1].judgeParams);
});
test("flow snapshot keeps the execution request and omits transient parameter picker state", () => {
  const flow = branch();
  flow.then[0].actions[0].behaviorParameters.values = { amount: "5" };
  flow.then[0].actions[0].behaviorParameters.ontologyPickers = [{ rows: [{ unrelated: "transient" }] }];
  const result = buildRequest([flow]);
  assert.equal(result.ok, true);
  const snapshot = JSON.parse(result.request.rule.flowDocument);
  assert.deepEqual(Object.keys(snapshot.steps[0].then[0].actions[0].behaviorParameters), ["request"]);
  assert.equal(flow.then[0].actions[0].behaviorParameters.values.amount, "5");
});
test("operators map to documented enums and legacy prefix matching is rejected", () => {
  for (const [operator, expected] of Object.entries({
    eq: "EQ",
    neq: "NE",
    gt: "GT",
    gte: "GE",
    lt: "LT",
    lte: "LE",
    contains: "CONTAINS",
    notContains: "NOT_CONTAINS",
  })) {
    const flow = branch();
    flow.condition.children[0] = { ...leaf, operator };
    assert.equal(buildRequest([flow]).request.rule.judgeRules[0].judgeParams[0].condition, expected);
  }
  const flow = branch();
  flow.condition.children[0] = { ...leaf, operator: "prefixContains" };
  const result = buildRequest([flow]);
  assert.equal(result.ok, false);
  assert.match(result.error, /前置包含/);
});
test("condition editor offers the supported string operators without prefix or change", () => {
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleConditionEditor.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const { outputText } = transpileModule(compileScript(descriptor, { id: "rule-operator-select" }).content, {
    compilerOptions: { module: ModuleKind.CommonJS },
  });
  const exports = {};
  new Function("require", "exports", outputText)((id) => (id === "vue" ? Vue : {}), exports);
  const page = exports.default.setup({ node: { type: "leaf" } }, { expose() {}, emit() {} });
  assert.deepEqual(
    page.operators.map((option) => option.value),
    ["eq", "neq", "gt", "lt", "gte", "lte", "contains", "notContains"],
  );
});
test("variables require exactly one instance and send unique property identifiers", () => {
  const variable = { kind: "variable", objectId: "ship", propertyId: "longitude", propertyName: "经度", instanceIds: ["0"] };
  const flow = branch();
  flow.condition.children[0] = { ...leaf, left: variable };
  assert.deepEqual(buildRequest([flow]).request.rule.judgeRules[0].judgeParams[0].leftOperate, {
    type: "dynamic",
    OntologyId: "ship",
    entityId: "0",
    propertyId: "longitude",
  });
  for (const instanceIds of [[], ["1", "2"], [""]]) {
    variable.instanceIds = instanceIds;
    assert.equal(buildRequest([flow]).ok, false);
  }
});
test("flat AND OR conditions link the next item and omit final link", () => {
  for (const logic of ["and", "or"]) {
    const result = buildRequest([branch({ type: "composite", logic, children: [leaf, leaf] })]);
    assert.deepEqual(
      result.request.rule.judgeRules[0].judgeParams.map((item) => item.linkFlag),
      [logic.toUpperCase(), undefined],
    );
  }
});

test("nested groups encode A AND ((B AND C) OR (D AND E)) for both if and else", () => {
  const makeLeaf = (name) => ({ ...leaf, id: name, left: literal(name), right: literal(name), operator: "eq" });
  const group = (logic, children) => ({ type: "composite", logic, children });
  const condition = group("and", [makeLeaf("A"), group("or", [group("and", [makeLeaf("B"), makeLeaf("C")]), group("and", [makeLeaf("D"), makeLeaf("E")])])]);
  const before = structuredClone(condition);
  const result = buildRequest([branch(condition)]);
  assert.equal(result.ok, true);
  const [whenTrue, whenFalse] = result.request.rule.judgeRules;
  assert.equal(whenTrue.condition, false);
  assert.equal(whenFalse.condition, true);
  assert.deepEqual(whenTrue.judgeParams, whenFalse.judgeParams);
  assert.deepEqual(
    whenTrue.judgeParams.map(({ leftOperate, isLeft, isRight, linkFlag }) => [leftOperate.fixValue, isLeft, isRight, linkFlag]),
    [
      ["A", undefined, undefined, "AND"],
      ["B", 2, undefined, "AND"],
      ["C", undefined, 1, "OR"],
      ["D", 1, undefined, "AND"],
      ["E", undefined, 2, undefined],
    ],
  );
  assert.deepEqual(condition, before);
});

test("nested groups preserve truth values for all inputs and aggregate single-item parentheses", () => {
  const makeLeaf = (name) => ({ ...leaf, id: name, left: literal(name), right: literal("true"), operator: "eq" });
  const group = (logic, children) => ({ type: "composite", logic, children });
  const condition = group("and", [makeLeaf("A"), group("or", [group("and", [makeLeaf("B"), makeLeaf("C")]), group("and", [makeLeaf("D"), makeLeaf("E")])])]);
  const result = buildRequest([branch(condition)]);
  assert.equal(result.ok, true);
  const items = result.request.rule.judgeRules[0].judgeParams;
  for (let mask = 0; mask < 32; mask++) {
    const values = Object.fromEntries(["A", "B", "C", "D", "E"].map((name, index) => [name, Boolean(mask & (1 << index))]));
    const expression = items
      .map(
        (item) =>
          `${"(".repeat(item.isLeft ?? 0)}${values[item.leftOperate.fixValue]}${")".repeat(item.isRight ?? 0)}${item.linkFlag === "AND" ? "&&" : item.linkFlag === "OR" ? "||" : ""}`,
      )
      .join("");
    assert.equal(Function(`return (${expression})`)(), values.A && ((values.B && values.C) || (values.D && values.E)));
  }
  const single = buildRequest([branch(group("and", [group("or", [group("and", [makeLeaf("A")])])]))]);
  assert.equal(single.ok, true);
  assert.equal(single.request.rule.judgeRules[0].judgeParams[0].isLeft, 2);
  assert.equal(single.request.rule.judgeRules[0].judgeParams[0].isRight, 2);
});

test("empty nested groups are rejected instead of silently changing conditions", () => {
  const condition = { type: "composite", logic: "and", children: [leaf, { type: "composite", logic: "or", children: [] }] };
  const result = buildRequest([branch(condition)]);
  assert.equal(result.ok, false);
  assert.match(result.error, /条件/);
});

test("A AND B AND (C OR D) preserves ordering and closes the final group", () => {
  const makeLeaf = (name) => ({ ...leaf, id: name, left: literal(name), right: literal(name), operator: "eq" });
  const condition = {
    type: "composite",
    logic: "and",
    children: [makeLeaf("A"), makeLeaf("B"), { type: "composite", logic: "or", children: [makeLeaf("C"), makeLeaf("D")] }],
  };
  const result = buildRequest([branch(condition)]);
  assert.equal(result.ok, true);
  assert.deepEqual(
    result.request.rule.judgeRules[0].judgeParams.map(({ leftOperate, isLeft, isRight, linkFlag }) => [leftOperate.fixValue, isLeft, isRight, linkFlag]),
    [
      ["A", undefined, undefined, "AND"],
      ["B", undefined, undefined, "AND"],
      ["C", 1, undefined, "OR"],
      ["D", undefined, 1, undefined],
    ],
  );
});
test("invalid space, empty flow, missing action snapshot, mismatched behavior fail", () => {
  assert.equal(buildRequest([branch()], "").ok, false);
  assert.equal(buildRequest([]).ok, false);
  assert.equal(buildRequest([actions()]).ok, false);
  assert.equal(buildRequest([branch({ type: "composite", logic: "and", children: [] })]).ok, false);
  const nested = branch();
  nested.then = [branch()];
  assert.equal(buildRequest([nested]).ok, true);
  const flow = branch();
  delete flow.then[0].actions[0].behaviorParameters;
  assert.equal(buildRequest([flow]).ok, false);
  const mismatch = branch();
  mismatch.then[0].actions[0].behaviorParameters.request.actionApi = "other";
  assert.equal(buildRequest([mismatch]).ok, false);
  for (const kind of ["function", "expression"]) {
    const unsupported = branch();
    unsupported.condition.children[0] = { ...leaf, left: { kind } };
    assert.equal(buildRequest([unsupported]).ok, false);
  }
});

test("real create form emits converted RULE payload and blocks unsupported operands or repeated submits", async () => {
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleFormDialog.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const { outputText } = transpileModule(compileScript(descriptor, { id: "rule-create-form" }).content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  let definitionLoads = 0;
  const parameterConfig = {
    cancelParameterRequests() {},
    clearDetailParamState() {},
    clearRelationTestState() {},
    loadApplicationTestForm: async () => {
      definitionLoads++;
    },
    detailError: Vue.ref(""),
  };
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return Vue;
    if (id === "@/types") return scheduleTypes;
    if (id.includes("useBehaviorParameters")) return { useBehaviorParameters: () => parameterConfig };
    if (id.includes("buildRuleScheduleCreateParams")) return { buildRuleScheduleCreateParams };
    if (id.includes("scheduleRuleFlowFactory")) return { cloneScheduleRuleFlow: (value) => JSON.parse(JSON.stringify(value)) };
    return {};
  }, exports);
  const props = Vue.reactive({ modelValue: true, mode: "create", spaceId: "156", initialDraft: null, behaviorOptions: options, submitting: false });
  const emitted = [];
  const scope = Vue.effectScope();
  const page = scope.run(() => exports.default.setup(props, { expose() {}, emit: (...args) => emitted.push(args) }));
  await Vue.nextTick();
  page.draft.name = "rule";
  page.draft.ruleFlow = { steps: [branch()] };
  page.submitCreateScheduleForm();
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0][0], "confirm");
  assert.equal(emitted[0][2].type, "RULE");
  assert.equal(emitted[0][2].rule.judgeRules.length, 2);
  props.submitting = true;
  page.submitCreateScheduleForm();
  assert.equal(emitted.length, 1);
  props.submitting = false;
  page.draft.ruleFlow.steps[0].condition.children[0].operator = "prefixContains";
  page.submitCreateScheduleForm();
  assert.equal(emitted.length, 1);
  assert.match(page.validationError.value, /前置包含/);
  props.modelValue = false;
  await Vue.nextTick();
  props.mode = "edit";
  props.initialDraft = { ...emitted[0][1], behaviorActionApi: "app" };
  props.modelValue = true;
  await Vue.nextTick();
  assert.deepEqual(JSON.parse(JSON.stringify(page.draft.ruleFlow)), emitted[0][1].ruleFlow);
  assert.equal(definitionLoads, 0, "RULE editor must not initialize unrelated periodic parameters");
  props.ruleDetailGroups = [
    {
      flow: props.initialDraft.ruleFlow,
      actionDetails: {
        a: {
          actionApi: "app",
          ontologyIdentifier: "ship",
          entityJson: JSON.stringify(page.draft.ruleFlow.steps[0].then[0].actions[0].behaviorParameters.request),
          entityId: "",
        },
      },
    },
  ];
  delete page.draft.ruleFlow.steps[0].then[0].actions[0].behaviorParameters;
  page.submitCreateScheduleForm();
  assert.equal(emitted.length, 2);
  assert.equal(emitted[1][2].type, "RULE");
  assert.equal(typeof emitted[1][2].rule.flowDocument, "string");
  assert.equal(emitted[1][2].rule.judgeRules.length, 2);

  scope.stop();
});

/** @description 创建以布尔符号判断的分支。 @param {string} name 符号。 @returns {object} 条件分支。 */
function symbolicBranch(name) {
  return branch({ type: "composite", logic: "and", children: [{ ...leaf, left: literal(name), right: literal("true"), operator: "eq" }] });
}
/** @description 执行序列化判断项，验证括号、连接符及整体取反。 @param {object} rule 规则。 @param {object} values 输入符号。 @returns {boolean} 是否命中。 */
function matchesRule(rule, values) {
  const expression = rule.judgeParams
    .map((item) => {
      const left = values[item.leftOperate.fixValue] ?? item.leftOperate.fixValue;
      const right = item.rightOperate.fixValue === "true" ? true : item.rightOperate.fixValue;
      const result = item.condition === "EQ" ? left === right : item.condition === "NE" ? left !== right : false;
      return `${"(".repeat(item.isLeft ?? 0)}${result}${")".repeat(item.isRight ?? 0)}${item.linkFlag === "AND" ? "&&" : item.linkFlag === "OR" ? "||" : ""}`;
    })
    .join("");
  const result = Function(`return (${expression})`)();
  return rule.condition ? !result : result;
}

test("three nested if levels and else-if preserve all ancestor predicates for every boolean input", () => {
  const root = symbolicBranch("A");
  const inner = symbolicBranch("B");
  const deepest = symbolicBranch("C");
  deepest.then = [actions(1), actions(2)];
  deepest.otherwise = [actions(3)];
  inner.then = [deepest];
  inner.otherwise = [actions(4)];
  root.then = [inner];
  const elseIf = symbolicBranch("D");
  elseIf.then = [actions(5)];
  elseIf.otherwise = [actions(6)];
  root.otherwise = [elseIf];
  const before = structuredClone(root);
  const result = buildRequest([root]);
  assert.equal(result.ok, true, result.error);
  for (let mask = 0; mask < 16; mask++) {
    const values = Object.fromEntries(["A", "B", "C", "D"].map((name, index) => [name, Boolean(mask & (1 << index))]));
    const selected = result.request.rule.judgeRules
      .filter((rule) => matchesRule(rule, values))
      .map((rule) => JSON.parse(rule.actionParam.entity_json).params.longitude);
    assert.deepEqual(selected, values.A ? (values.B ? (values.C ? [1, 2] : [3]) : [4]) : values.D ? [5] : [6]);
  }
  assert.deepEqual(root, before);
  assert.deepEqual(JSON.parse(result.request.rule.flowDocument).steps, [root]);
});

test("if switch if and nested switch defaults retain outer constraints", () => {
  const root = symbolicBranch("A");
  const inner = symbolicBranch("B");
  inner.then = [actions(1)];
  inner.otherwise = [actions(2)];
  const nestedSwitch = { kind: "switch", switchOn: literal("W"), cases: [{ value: literal("x"), steps: [actions(3)] }], defaultSteps: [actions(4)] };
  root.then = [
    {
      kind: "switch",
      switchOn: literal("V"),
      cases: [
        { value: literal("one"), steps: [inner] },
        { value: literal("two"), steps: [nestedSwitch] },
      ],
      defaultSteps: [actions(5)],
    },
  ];
  root.otherwise = [actions(6)];
  const result = buildRequest([root]);
  assert.equal(result.ok, true, result.error);
  for (const A of [true, false])
    for (const B of [true, false])
      for (const V of ["one", "two", "other"])
        for (const W of ["x", "y"]) {
          const selected = result.request.rule.judgeRules
            .filter((rule) => matchesRule(rule, { A, B, V, W }))
            .map((rule) => JSON.parse(rule.actionParam.entity_json).params.longitude);
          assert.deepEqual(selected, [!A ? 6 : V === "one" ? (B ? 1 : 2) : V === "two" ? (W === "x" ? 3 : 4) : 5]);
        }
});

test("local negation complements every supported operator and applies De Morgan to grouped predicates", () => {
  const inverses = { eq: "NE", neq: "EQ", gt: "LE", gte: "LT", lt: "GE", lte: "GT", contains: "NOT_CONTAINS", notContains: "CONTAINS" };
  for (const [operator, expected] of Object.entries(inverses)) {
    const outer = symbolicBranch("A");
    const inner = branch({
      type: "composite",
      logic: "or",
      children: [
        { ...leaf, operator },
        { ...leaf, operator },
      ],
    });
    inner.then = [];
    inner.otherwise = [actions(7)];
    outer.then = [inner];
    outer.otherwise = null;
    const result = buildRequest([outer]);
    assert.equal(result.ok, true, result.error);
    const rule = result.request.rule.judgeRules[0];
    assert.equal(rule.condition, false);
    assert.deepEqual(
      rule.judgeParams.slice(1).map((item) => item.condition),
      [expected, expected],
    );
    assert.equal(rule.judgeParams[1].linkFlag, "AND");
  }
});

test("no arbitrary depth cap, empty paths are allowed and sequential condition dependencies are rejected", () => {
  let root = symbolicBranch("A");
  for (let i = 0; i < 12; i++) {
    const parent = symbolicBranch("A");
    parent.then = [root];
    parent.otherwise = null;
    root = parent;
  }
  assert.equal(buildRequest([root]).ok, true);
  const empty = symbolicBranch("A");
  empty.then = [];
  empty.otherwise = [];
  assert.equal(buildRequest([empty]).ok, false);
  const sequence = symbolicBranch("A");
  sequence.then = [actions(), symbolicBranch("B")];
  const result = buildRequest([sequence]);
  assert.equal(result.ok, false);
  assert.match(result.error, /顺序/);
});

test("nested local negation preserves mixed AND OR groups for all boolean combinations", () => {
  const makeLeaf = (name) => ({ ...leaf, left: literal(name), right: literal("true"), operator: "eq" });
  const group = (logic, children) => ({ type: "composite", logic, children });
  const root = symbolicBranch("A");
  const inner = branch(group("and", [makeLeaf("B"), group("or", [makeLeaf("C"), group("and", [makeLeaf("D"), makeLeaf("E")])])]));
  inner.then = [actions(1)];
  inner.otherwise = [actions(2)];
  root.then = [];
  root.otherwise = [inner];
  const result = buildRequest([root]);
  assert.equal(result.ok, true, result.error);
  for (let mask = 0; mask < 32; mask++) {
    const values = Object.fromEntries(["A", "B", "C", "D", "E"].map((name, index) => [name, Boolean(mask & (1 << index))]));
    const selected = result.request.rule.judgeRules
      .filter((rule) => matchesRule(rule, values))
      .map((rule) => JSON.parse(rule.actionParam.entity_json).params.longitude);
    assert.deepEqual(selected, values.A ? [] : values.B && (values.C || (values.D && values.E)) ? [1] : [2]);
  }
});

test("duplicate switch cases execute all matching rules and exclude default, including nested branches", () => {
  const root = symbolicBranch("A");
  root.otherwise = null;
  root.then = [
    { kind: "switch", switchOn: literal("V"), cases: [1, 2].map((n) => ({ value: literal("same"), steps: [actions(n)] })), defaultSteps: [actions(3)] },
  ];
  const result = buildRequest([root]);
  assert.equal(result.ok, true, result.error);
  for (const [values, expected] of [
    [{ A: true, V: "same" }, [1, 2]],
    [{ A: true, V: "other" }, [3]],
    [{ A: false, V: "same" }, []],
  ]) {
    assert.deepEqual(
      result.request.rule.judgeRules.filter((rule) => matchesRule(rule, values)).map((rule) => JSON.parse(rule.actionParam.entity_json).params.longitude),
      expected,
    );
  }
});

test("editing untouched actions reuses validated saved requests while changed snapshots take priority", () => {
  const flow = branch();
  flow.otherwise = null;
  delete flow.then[0].actions[0].behaviorParameters;
  const draft = { name: "edited", description: "", ruleFlow: { steps: [flow] } };
  const saved = {
    a: {
      actionApi: "app",
      ontologyIdentifier: "ship",
      entityId: "",
      entityJson: JSON.stringify({ actionApi: "app", ontologySpaceId: 156, params: { longitude: 33 } }),
    },
  };
  const result = buildRuleScheduleCreateParams(draft, options, "156", saved);
  assert.equal(result.ok, true, result.error);
  assert.equal(JSON.parse(result.request.rule.judgeRules[0].actionParam.entity_json).params.longitude, 33);
  assert.equal(JSON.parse(result.request.rule.flowDocument).steps[0].then[0].actions[0].behaviorParameters.request.params.longitude, 33);
  for (const entityJson of ["{", "null", "[]", '{"actionApi":"wrong","ontologySpaceId":156}', '{"actionApi":"app","ontologySpaceId":2}']) {
    assert.equal(buildRuleScheduleCreateParams(draft, options, "156", { a: { ...saved.a, entityJson } }).ok, false);
  }
  flow.then[0].actions[0].behaviorParameters = actions(88).actions[0].behaviorParameters;
  const changed = buildRuleScheduleCreateParams(draft, options, "156", saved);
  assert.equal(changed.ok, true);
  assert.equal(JSON.parse(changed.request.rule.judgeRules[0].actionParam.entity_json).params.longitude, 88);
});
