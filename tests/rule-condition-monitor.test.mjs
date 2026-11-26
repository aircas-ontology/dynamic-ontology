import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildRuleScheduleCreateParams } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/buildRuleScheduleCreateParams.ts";
import { restoreRuleScheduleDetail } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/restoreRuleScheduleDetail.ts";
import { restoreRuleFlowDocument } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/restoreRuleFlowDocument.ts";
import { createEmptyMonitorLeafCondition, summarizeRuleCondition } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory.ts";
import { hasUnsupportedConditionValue, validateMonitorCondition } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/validateRuleConditionEditor.ts";

const options = [{ id: "action", actionApi: "app", ontologyUniqIdentifier: "ship", kind: "application" }];

/**
 * @description 创建带校验快照的执行行为步骤。
 * @param {number} value 参数值。
 * @returns {object} 行为步骤。
 */
function actions(value = 55) {
  return {
    kind: "actions",
    id: "actions",
    actions: [
      {
        id: "a",
        behaviorId: "action",
        behaviorName: "action",
        relatedObject: "ship",
        instanceIds: [],
        params: [],
        behaviorParameters: {
          request: { ontologySpaceId: "156", actionApi: "app", params: { longitude: value } },
        },
      },
    ],
  };
}

/**
 * @description 构造属性比较叶子。
 * @param {string} left 左固定值。
 * @param {string} right 右固定值。
 * @param {string} [operator] 比较符。
 * @returns {object} 比较叶子。
 */
function compareLeaf(left, right, operator = "lt") {
  return {
    id: `leaf-${left}-${right}`,
    type: "leaf",
    left: { kind: "input", text: left },
    right: { kind: "input", text: right },
    operator,
  };
}

/**
 * @description 构造旧监测叶子（仅对象+分组，兼容回显）。
 * @param {string} objectId 对象标识。
 * @param {string} storageGroup 存储分组。
 * @param {string} [objectName] 对象名。
 * @param {"insert"|"update"|"delete"} [monitorType] 监测事件。
 * @returns {object} 监测叶子。
 */
function monitorLeaf(objectId, storageGroup, objectName = objectId, monitorType = "insert") {
  return { id: `m-${objectId}-${storageGroup}`, type: "monitor", monitorType, objectId, objectName, storageGroup };
}

test("insert monitor branch submits group monitorType with compare-shaped judgeParams", () => {
  const condition = {
    id: "root",
    type: "composite",
    logic: "and",
    monitorType: "insert",
    children: [compareLeaf("30", "battery"), compareLeaf("危险", "status", "eq")],
  };
  const result = buildRuleScheduleCreateParams(
    { name: "monitor", description: "", ruleFlow: { steps: [{ kind: "branch", id: "b1", condition, then: [actions()], otherwise: null }] } },
    options,
    "156",
  );
  assert.equal(result.ok, true);
  const group = result.request.rule.judgeRules[0];
  assert.equal(group.monitorType, "insert");
  assert.equal(group.condition, false);
  assert.deepEqual(group.judgeParams, [
    {
      leftOperate: { type: "fixed", fixValue: "30" },
      rightOperate: { type: "fixed", fixValue: "battery" },
      condition: "LT",
      linkFlag: "AND",
    },
    {
      leftOperate: { type: "fixed", fixValue: "危险" },
      rightOperate: { type: "fixed", fixValue: "status" },
      condition: "EQ",
    },
  ]);
});

test("insert monitor dynamic operands omit main entityId and subtable dataPrimaryKey", () => {
  const mainLeft = {
    kind: "variable",
    objectId: "plane",
    objectName: "飞机",
    objectKind: "object",
    propertyId: "id1",
    propertyName: "标识1",
    instanceIds: [],
    storageGroup: "main",
  };
  const subLeft = {
    kind: "variable",
    objectId: "plane",
    objectName: "飞机",
    objectKind: "object",
    propertyId: "range",
    propertyName: "武器射程",
    instanceIds: ["qxh-test"],
    storageGroup: "weapons",
    dataPrimaryKey: "should-not-pass",
  };
  const condition = {
    id: "root",
    type: "composite",
    logic: "and",
    monitorType: "insert",
    children: [
      { id: "one", type: "leaf", left: mainLeft, operator: "eq", right: { kind: "input", text: "1" } },
      { id: "two", type: "leaf", left: subLeft, operator: "eq", right: { kind: "input", text: "2" } },
    ],
  };
  const result = buildRuleScheduleCreateParams(
    { name: "monitor-bind", description: "", ruleFlow: { steps: [{ kind: "branch", id: "b1", condition, then: [actions()], otherwise: null }] } },
    options,
    "156",
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.request.rule.judgeRules[0].judgeParams[0].leftOperate, {
    type: "dynamic",
    OntologyId: "plane",
    propertyId: "id1",
  });
  assert.deepEqual(result.request.rule.judgeRules[0].judgeParams[1].leftOperate, {
    type: "dynamic",
    OntologyId: "plane",
    entityId: "qxh-test",
    propertyId: "range",
  });
});

test("update and delete only change monitorType with identical judgeParams shape", () => {
  const children = [compareLeaf("1", "2", "eq")];
  for (const monitorType of ["update", "delete"]) {
    const result = buildRuleScheduleCreateParams(
      {
        name: monitorType,
        description: "",
        ruleFlow: {
          steps: [
            { kind: "branch", id: "b1", condition: { id: "root", type: "composite", logic: "and", monitorType, children }, then: [actions()], otherwise: null },
          ],
        },
      },
      options,
      "156",
    );
    assert.equal(result.ok, true);
    const group = result.request.rule.judgeRules[0];
    assert.equal(group.monitorType, monitorType);
    assert.deepEqual(group.judgeParams, [
      {
        leftOperate: { type: "fixed", fixValue: "1" },
        rightOperate: { type: "fixed", fixValue: "2" },
        condition: "EQ",
      },
    ]);
  }
});

test("delete monitor otherwise path flips group condition on single-level branch", () => {
  const condition = {
    id: "root",
    type: "composite",
    logic: "and",
    monitorType: "delete",
    children: [compareLeaf("a", "b", "eq"), compareLeaf("c", "d", "eq")],
  };
  const result = buildRuleScheduleCreateParams(
    {
      name: "monitor-delete",
      description: "",
      ruleFlow: {
        steps: [{ kind: "branch", id: "b1", condition, then: [actions(1)], otherwise: [actions(2)] }],
      },
    },
    options,
    "156",
  );
  assert.equal(result.ok, true);
  const [thenRule, elseRule] = result.request.rule.judgeRules;
  assert.equal(thenRule.monitorType, "delete");
  assert.equal(elseRule.monitorType, "delete");
  assert.equal(thenRule.condition, false);
  assert.equal(elseRule.condition, true);
  assert.deepEqual(thenRule.judgeParams, elseRule.judgeParams);
});

test("mixing property compare and monitor in one path is rejected", () => {
  const result = buildRuleScheduleCreateParams(
    {
      name: "mixed",
      description: "",
      ruleFlow: {
        steps: [
          {
            kind: "branch",
            id: "outer",
            condition: { id: "c1", type: "composite", logic: "and", children: [compareLeaf("1", "2", "eq")] },
            then: [
              {
                kind: "branch",
                id: "inner",
                condition: {
                  id: "c2",
                  type: "composite",
                  logic: "and",
                  monitorType: "insert",
                  children: [compareLeaf("3", "4", "eq")],
                },
                then: [actions()],
                otherwise: null,
              },
            ],
            otherwise: null,
          },
        ],
      },
    },
    options,
    "156",
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /混合|属性比较|监测/);
});

test("legacy monitor nodes are rejected on save", () => {
  const result = buildRuleScheduleCreateParams(
    {
      name: "legacy",
      description: "",
      ruleFlow: {
        steps: [
          {
            kind: "branch",
            id: "b1",
            condition: {
              id: "root",
              type: "composite",
              logic: "and",
              monitorType: "insert",
              children: [monitorLeaf("ship-id", "main")],
            },
            then: [actions()],
            otherwise: null,
          },
        ],
      },
    },
    options,
    "156",
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /属性比较表单/);
});

test("restoreRuleScheduleDetail rebuilds compare leaves for isomorphic monitor payload", () => {
  const restored = restoreRuleScheduleDetail(
    {
      judgeRules: [
        {
          monitorType: "update",
          condition: false,
          judgeParams: [
            {
              leftOperate: { type: "dynamic", OntologyId: "ship-id", entityId: "3", propertyName: "battery" },
              rightOperate: { type: "fixed", fixValue: "30" },
              condition: "LT",
              isLeft: 1,
              linkFlag: "AND",
            },
            {
              leftOperate: { type: "dynamic", OntologyId: "ship-id", entityId: "3", propertyName: "status" },
              rightOperate: { type: "fixed", fixValue: "危险" },
              condition: "EQ",
              isRight: 1,
            },
          ],
          actionParam: {
            action_api: "app",
            ontology_identifier: "ship",
            entity_json: '{"ontologySpaceId":156,"actionApi":"app","params":{}}',
          },
        },
      ],
    },
    options,
  );
  assert.equal(restored.ok, true);
  const branch = restored.groups[0].flow.steps[0];
  assert.equal(branch.kind, "branch");
  assert.equal(branch.condition.monitorType, "update");
  assert.equal(branch.condition.children[0].type, "leaf");
  assert.equal(branch.condition.children[0].operator, "lt");
  assert.equal(branch.condition.children[1].type, "leaf");
});

test("restoreRuleScheduleDetail still rebuilds legacy monitor leaves", () => {
  const restored = restoreRuleScheduleDetail(
    {
      judgeRules: [
        {
          monitorType: "insert",
          condition: false,
          judgeParams: [
            {
              leftOperate: { type: "dynamic", OntologyId: "ship-id", storageGroup: "orbit" },
              isLeft: 1,
              linkFlag: "AND",
            },
            {
              leftOperate: { type: "dynamic", OntologyId: "ship-id", storageGroup: "cargo" },
              isRight: 1,
            },
          ],
          actionParam: {
            action_api: "app",
            ontology_identifier: "ship",
            entity_json: '{"ontologySpaceId":156,"actionApi":"app","params":{}}',
          },
        },
      ],
    },
    options,
  );
  assert.equal(restored.ok, true);
  const leaves = [];
  /** @description 收集监测叶子。 @param {object} node 条件节点。 */
  function walk(node) {
    if (node.type === "monitor") leaves.push(node);
    if (node.type === "composite") node.children.forEach(walk);
  }
  walk(restored.groups[0].flow.steps[0].condition);
  assert.deepEqual(
    leaves.map((item) => ({ objectId: item.objectId, storageGroup: item.storageGroup })),
    [
      { objectId: "ship-id", storageGroup: "orbit" },
      { objectId: "ship-id", storageGroup: "cargo" },
    ],
  );
});

test("restoreRuleFlowDocument keeps monitorType and monitor leaves", () => {
  const document = JSON.stringify({
    version: 1,
    steps: [
      {
        id: "b1",
        kind: "branch",
        condition: {
          id: "root",
          type: "composite",
          logic: "and",
          monitorType: "delete",
          children: [monitorLeaf("ship-id", "main", "船舶", "delete")],
        },
        then: [
          {
            id: "actions",
            kind: "actions",
            actions: [
              {
                id: "a",
                behaviorId: "action",
                behaviorName: "action",
                relatedObject: "ship",
                instanceIds: [],
                params: [],
                behaviorParameters: { request: { ontologySpaceId: "156", actionApi: "app", params: {} } },
              },
            ],
          },
        ],
        otherwise: null,
      },
    ],
  });
  const restored = restoreRuleFlowDocument(document);
  assert.equal(restored.ok, true);
  const condition = restored.group.flow.steps[0].condition;
  assert.equal(condition.monitorType, "delete");
  assert.equal(condition.children[0].type, "monitor");
  assert.equal(condition.children[0].storageGroup, "main");
});

test("summarizeRuleCondition describes monitor leaves", () => {
  assert.equal(summarizeRuleCondition(monitorLeaf("ship-id", "orbit", "船舶")), "新增 · 船舶 / orbit");
  assert.equal(summarizeRuleCondition(monitorLeaf("ship-id", "orbit", "船舶", "update")), "更新 · 船舶 / orbit");
  assert.match(
    summarizeRuleCondition({
      id: "root",
      type: "composite",
      logic: "and",
      children: [monitorLeaf("ship-id", "main", "船舶", "delete")],
    }),
    /删除/,
  );
});

test("factory creates empty monitor leaf with main storage group", () => {
  const leaf = createEmptyMonitorLeafCondition("delete");
  assert.equal(leaf.type, "monitor");
  assert.equal(leaf.monitorType, "delete");
  assert.equal(leaf.storageGroup, "main");
  assert.equal(leaf.objectId, "");
});

test("nested isomorphic monitor path inverts compare operators for otherwise", () => {
  const result = buildRuleScheduleCreateParams(
    {
      name: "nested-monitor",
      description: "",
      ruleFlow: {
        steps: [
          {
            kind: "branch",
            id: "outer",
            condition: {
              id: "c1",
              type: "composite",
              logic: "and",
              monitorType: "insert",
              children: [compareLeaf("1", "2", "eq"), compareLeaf("3", "4", "eq")],
            },
            then: [
              {
                kind: "branch",
                id: "inner",
                condition: {
                  id: "c2",
                  type: "composite",
                  logic: "or",
                  monitorType: "insert",
                  children: [compareLeaf("5", "6", "eq")],
                },
                then: [actions(1)],
                otherwise: [actions(2)],
              },
            ],
            otherwise: null,
          },
        ],
      },
    },
    options,
    "156",
  );
  assert.equal(result.ok, true);
  const elseRule = result.request.rule.judgeRules[1];
  assert.equal(elseRule.condition, false);
  assert.equal(elseRule.monitorType, "insert");
  assert.ok(elseRule.judgeParams.some((item) => item.condition === "NE"));
});

test("validateMonitorCondition blocks legacy monitor leaves before save", () => {
  assert.equal(validateMonitorCondition(monitorLeaf("ship-id", "main", "船舶")), "请将监测条件改为属性比较表单后再保存");
  assert.equal(
    validateMonitorCondition({
      id: "root",
      type: "composite",
      logic: "and",
      monitorType: "insert",
      children: [compareLeaf("1", "2", "eq")],
    }),
    "",
  );
  assert.equal(hasUnsupportedConditionValue(monitorLeaf("ship-id", "main")), false);
  assert.equal(
    hasUnsupportedConditionValue({
      id: "leaf",
      type: "leaf",
      left: { kind: "function", fn: "max", argKind: "value", arg: { kind: "input", text: "1" } },
      operator: "eq",
      right: { kind: "input", text: "1" },
    }),
    true,
  );
});

test("condition editor exposes change type on the root composite card", () => {
  const dialog = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleConditionEditorDialog.vue", import.meta.url), "utf8");
  const editor = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleConditionEditor.vue", import.meta.url), "utf8");
  const surface = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleConditionWireSurface.vue", import.meta.url), "utf8");
  assert.doesNotMatch(dialog, /rule-condition-editor__mode/);
  assert.match(dialog, /width="1180px"/);
  assert.match(dialog, /overflow-x:\s*hidden/);
  assert.match(dialog, /:before-close="handleConditionDialogBeforeClose"/);
  assert.match(dialog, /emit\("confirm"\)/);
  assert.match(dialog, /closeConditionDialogWithoutConfirm/);
  assert.match(editor, /v-if="isRoot"/);
  assert.match(editor, /ariaLabel="变更类型"/);
  assert.doesNotMatch(editor, /el-option label="属性比较"/);
  assert.match(editor, /新增实例或子表行/);
  assert.match(editor, /更新实例或子表行/);
  assert.match(editor, /删除实例或子表行/);
  assert.match(editor, /rule-condition-card__change-type/);
  assert.match(editor, /@remove="removeConditionChild\(child\.id\)"/);
  assert.match(editor, /function removeConditionChild/);
  assert.match(editor, /rule-condition-card__remove/);
  assert.match(editor, /width:\s*max-content/);
  assert.match(editor, /rule-condition-card__body[\s\S]*rule-condition-card__remove[\s\S]*<\/div>/);
  assert.doesNotMatch(editor, /@remove="node\.children\.splice\(index,\s*1\)"/);
  assert.match(surface, /ruleConditionRootKey/);
  assert.match(surface, /provide/);
});
