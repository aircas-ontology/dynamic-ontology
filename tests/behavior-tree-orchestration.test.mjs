import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  applyBehaviorTreeBlackboardPropertyBinding,
  applyBehaviorTreeBlackboardSourceChange,
  createBehaviorTreeBlackboardItem,
  mapBehaviorTreePropertyTypeToValueType,
  resolveBehaviorTreeBlackboardSource,
} from "../src/views/BehaviorTreeOrchestration/utils/behaviorTreeBlackboard.ts";
import {
  createBehaviorTreeKindMetaMap,
  formatBehaviorTreeMaxChildrenHint,
  isBehaviorTreeValueLessOp,
} from "../src/views/BehaviorTreeOrchestration/utils/behaviorTreeConstants.ts";
import {
  behaviorTreeConfigToDraft,
  buildBehaviorTreeDefinition,
  buildBehaviorTreeNodeConfig,
  buildBehaviorTreeSavePayload,
  importBehaviorTreeDefinition,
  importBehaviorTreeSerializedNode,
} from "../src/views/BehaviorTreeOrchestration/utils/behaviorTreeDefinition.ts";
import { layoutBehaviorTreeRoots } from "../src/views/BehaviorTreeOrchestration/utils/behaviorTreeLayout.ts";
import {
  behaviorTreeSubtreeContains,
  canAttachBehaviorTreeChild,
  createDefaultBehaviorTreeConfig,
  createEmptyBehaviorTreeModel,
  findBehaviorTreeNode,
  findBehaviorTreeParent,
  nextBehaviorTreeNodeId,
  placeOfNewBehaviorTreeNode,
  removeBehaviorTreeNodeFromTree,
  renameBehaviorTreeKeyRefs,
  reorderBehaviorTreeChild,
  reparentBehaviorTreeNode,
} from "../src/views/BehaviorTreeOrchestration/utils/behaviorTreeModel.ts";
import {
  behaviorTreeEmptyToNull,
  behaviorTreeIntOrNull,
  behaviorTreeValueToText,
  parseBehaviorTreeTypedValue,
} from "../src/views/BehaviorTreeOrchestration/utils/behaviorTreeTypedValue.ts";
import {
  extractBehaviorTreeDefinitionFromDetail,
  resolveBehaviorTreeSaveMethod,
} from "../src/views/BehaviorTreeOrchestration/utils/behaviorTreePersistence.ts";
import { collectBehaviorTreeErrors, collectBehaviorTreeWarnings } from "../src/views/BehaviorTreeOrchestration/utils/behaviorTreeValidate.ts";
import {
  buildBehaviorTreeTestPayload,
  collectBehaviorTreeExecMissingFields,
  createBehaviorTreeNodeExecDraft,
  listBehaviorTreeExecPlanNodeIds,
  listBehaviorTreeExecPlanObjectIds,
  mapBehaviorTreeBoundActionApis,
  mapBehaviorTreeEntityRecordOption,
  resolveBehaviorTreeNodeDisplayName,
  resolveBehaviorTreeNodeLinkEnds,
} from "../src/views/BehaviorTreeOrchestration/utils/behaviorTreeExecutePlan.ts";

/**
 * @description 读取源码文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

/**
 * @description 构造节点草稿。
 * @param partial 覆盖字段。
 * @returns 节点。
 */
function makeNode(partial) {
  return {
    id: "node_x",
    kind: "SEQUENCE",
    displayName: "",
    enabled: true,
    skipIf: "",
    whileCondition: "",
    config: createDefaultBehaviorTreeConfig(partial.kind || "SEQUENCE"),
    children: [],
    _x: 0,
    _y: 0,
    ...partial,
  };
}

test("behavior tree model validates single root and blackboard", () => {
  const kindMeta = createBehaviorTreeKindMetaMap();
  const model = createEmptyBehaviorTreeModel();
  assert.deepEqual(collectBehaviorTreeErrors(model, kindMeta), ["行为树必须且只能有一个根节点，当前 0 个"]);

  model.blackboard.push(
    createBehaviorTreeBlackboardItem("ammoCount", {
      valueType: "INTEGER",
      defaultValueText: "3",
    }),
  );
  const seq = { value: 1 };
  const root = makeNode({
    id: nextBehaviorTreeNodeId(model.roots, seq),
    kind: "SEQUENCE",
    displayName: "顺序节点",
    config: createDefaultBehaviorTreeConfig("SEQUENCE"),
  });
  model.roots.push(root);
  assert.match(collectBehaviorTreeErrors(model, kindMeta).join("|"), /至少要有子节点/);
  assert.equal(canAttachBehaviorTreeChild(model.roots, kindMeta, root.id, null), true);
  const propertyRow = createBehaviorTreeBlackboardItem("hp", { source: "PROPERTY" });
  applyBehaviorTreeBlackboardPropertyBinding(propertyRow, {
    id: "prop.hp",
    objectId: "obj.tank",
    displayName: "生命",
    propertyType: "Int",
  });
  assert.equal(propertyRow.bindPropertyUniqueIdentifier, "prop.hp");
  assert.equal(propertyRow.valueType, "INTEGER");
  applyBehaviorTreeBlackboardPropertyBinding(propertyRow, null);
  assert.equal(propertyRow.bindPropertyUniqueIdentifier, "prop.hp");
});

test("behavior tree maxChildren hint formats container decorator and leaf rules", () => {
  assert.equal(formatBehaviorTreeMaxChildrenHint(-1), "可连接多个子节点");
  assert.equal(formatBehaviorTreeMaxChildrenHint(0), "不可连接子节点");
  assert.equal(formatBehaviorTreeMaxChildrenHint(1), "仅可连接 1 个子节点");
  assert.equal(formatBehaviorTreeMaxChildrenHint(3), "最多可连接 3 个子节点");
  const kindMeta = createBehaviorTreeKindMetaMap();
  assert.equal(formatBehaviorTreeMaxChildrenHint(kindMeta.SELECTOR.maxChildren), "可连接多个子节点");
  assert.equal(formatBehaviorTreeMaxChildrenHint(kindMeta.INVERTER.maxChildren), "仅可连接 1 个子节点");
  assert.equal(formatBehaviorTreeMaxChildrenHint(kindMeta.ACTION.maxChildren), "不可连接子节点");
  const paletteSource = readSource("../src/views/BehaviorTreeOrchestration/components/BehaviorTreePalette.vue");
  assert.match(paletteSource, /formatBehaviorTreeMaxChildrenHint/);
  assert.match(paletteSource, /behavior-tree-palette__item-hint|可连接多个子节点/);
  assert.match(paletteSource, /\["COMPOSITE",\s*"DECORATOR"\]/);
  assert.doesNotMatch(paletteSource, /\["COMPOSITE",\s*"DECORATOR",\s*"LEAF"\]/);
  assert.doesNotMatch(paletteSource, /Array<"COMPOSITE"\s*\|\s*"DECORATOR"\s*\|\s*"LEAF">/);
  const inspectorSource = readSource("../src/views/BehaviorTreeOrchestration/components/BehaviorTreeNodeInspector.vue");
  assert.match(inspectorSource, /formatBehaviorTreeMaxChildrenHint/);
  assert.match(inspectorSource, /kindMeta/);
  const dialogSource = readSource("../src/views/BehaviorTreeOrchestration/BehaviorTreeOrchestrationDialog.vue");
  assert.match(dialogSource, /:kind-meta="kindMeta"|kind-meta=/);
});

test("behavior tree definition round-trips and builds TREE payload", () => {
  const kindMeta = createBehaviorTreeKindMetaMap();
  const model = createEmptyBehaviorTreeModel();
  model.blackboard.push(
    createBehaviorTreeBlackboardItem("ammoCount", {
      valueType: "INTEGER",
      source: "EXTERNAL",
      defaultValueText: "1",
      description: "弹药",
    }),
    createBehaviorTreeBlackboardItem("fixedFlag", {
      valueType: "BOOL",
      source: "FIXED",
      fixedValueText: "true",
    }),
    createBehaviorTreeBlackboardItem("hp", {
      valueType: "INTEGER",
      source: "PROPERTY",
      bindPropertyUniqueIdentifier: "prop.hp",
    }),
  );
  model.roots.push(
    makeNode({
      id: "node_seq",
      kind: "SEQUENCE",
      displayName: "顺序",
      children: [
        makeNode({
          id: "node_cond",
          kind: "BLACKBOARD_CONDITION",
          displayName: "条件",
          config: { key: "missingKey", op: "EQ", value: "1" },
          children: [],
        }),
        makeNode({
          id: "node_1",
          kind: "ACTION",
          displayName: "行为节点",
          skipIf: "ammoCount > 0",
          whileCondition: "",
          config: { actionApi: "act.demo.ping", timeoutSeconds: "", retryTimes: "" },
          children: [],
        }),
      ],
    }),
  );
  layoutBehaviorTreeRoots(model.roots);
  const definition = buildBehaviorTreeDefinition(model, kindMeta);
  assert.equal(definition.roots.length, 1);
  assert.equal(definition.roots[0].children[1].config.actionApi, "act.demo.ping");
  assert.equal(definition.roots[0].children[1].skipIf, "ammoCount > 0");
  assert.equal(definition.roots[0].children[0].config.key, "missingKey");
  assert.equal(definition.blackboard[0].source, "EXTERNAL");
  assert.equal(definition.blackboard[1].source, "FIXED");
  assert.equal(definition.blackboard[1].value, true);
  assert.equal(definition.blackboard[2].source, "PROPERTY");
  assert.equal(definition.blackboard[2].bindPropertyUniqueIdentifier, "prop.hp");
  assert.equal(definition.variables.length, 1);
  assert.equal(definition.variables[0].name, "ammoCount");
  assert.equal(definition.variables[0].defaultValue, 1);
  const restored = importBehaviorTreeDefinition(definition);
  assert.equal(restored.blackboard[0].key, "ammoCount");
  assert.equal(restored.blackboard[0].source, "EXTERNAL");
  assert.equal(restored.blackboard[0].defaultValueText, "1");
  assert.equal(restored.blackboard[1].source, "FIXED");
  assert.equal(restored.blackboard[1].fixedValueText, "true");
  assert.equal(restored.blackboard[2].source, "PROPERTY");
  assert.equal(restored.roots[0].kind, "SEQUENCE");
  assert.equal(restored.roots[0].children[1].kind, "ACTION");

  const payload = buildBehaviorTreeSavePayload(model, kindMeta, {
    spaceId: "156",
    categoryId: "14",
    actionApi: "tree.ammo.check",
    displayName: "弹药检查",
    description: "",
  });
  assert.equal(payload.actionKind, "TREE");
  assert.equal(payload.ontologySpaceId, 156);
  assert.equal(payload.categoryId, 14);
  assert.equal(payload.description, null);

  const payloadNoCategory = buildBehaviorTreeSavePayload(model, kindMeta, {
    spaceId: "1",
    categoryId: "  ",
    actionApi: "tree.x",
    displayName: "x",
    description: "desc",
  });
  assert.equal(payloadNoCategory.categoryId, null);

  assert.equal(resolveBehaviorTreeBlackboardSource({ source: "", bindPropertyUniqueIdentifier: "p1" }), "PROPERTY");
  assert.equal(mapBehaviorTreePropertyTypeToValueType("Int"), "INTEGER");
  const switched = createBehaviorTreeBlackboardItem("tmp", { defaultValueText: "1", fixedValueText: "2", bindPropertyUniqueIdentifier: "p" });
  applyBehaviorTreeBlackboardSourceChange(switched, "FIXED");
  assert.equal(switched.source, "FIXED");
  assert.equal(switched.defaultValueText, "");
  assert.equal(switched.bindPropertyUniqueIdentifier, "");
});

test("behavior tree typed values and helpers cover parse paths", () => {
  assert.equal(parseBehaviorTreeTypedValue("hi", "STRING").ok, true);
  assert.equal(parseBehaviorTreeTypedValue("12", "INTEGER").value, 12);
  assert.equal(parseBehaviorTreeTypedValue("1.5", "INTEGER").ok, false);
  assert.equal(parseBehaviorTreeTypedValue("99", "LONG").ok, true);
  assert.equal(parseBehaviorTreeTypedValue("x", "LONG").ok, false);
  assert.equal(parseBehaviorTreeTypedValue("1.25", "DOUBLE").value, 1.25);
  assert.equal(parseBehaviorTreeTypedValue("true", "BOOL").value, true);
  assert.equal(parseBehaviorTreeTypedValue("FALSE", "BOOL").value, false);
  assert.equal(parseBehaviorTreeTypedValue("maybe", "BOOL").ok, false);
  assert.deepEqual(parseBehaviorTreeTypedValue("[1,2]", "LIST").value, [1, 2]);
  assert.deepEqual(parseBehaviorTreeTypedValue("a, b", "LIST").value, ["a", "b"]);
  assert.deepEqual(parseBehaviorTreeTypedValue('{"a":1}', "OBJECT").value, { a: 1 });
  assert.equal(parseBehaviorTreeTypedValue('"scalar"', "OBJECT").ok, false);
  assert.equal(parseBehaviorTreeTypedValue("nope", "OBJECT").ok, false);
  assert.equal(parseBehaviorTreeTypedValue("x", "UNKNOWN").ok, true);
  assert.equal(behaviorTreeValueToText(null), "");
  assert.equal(behaviorTreeValueToText(undefined), "");
  assert.equal(behaviorTreeValueToText({ a: 1 }), '{"a":1}');
  assert.equal(behaviorTreeValueToText(3), "3");
  layoutBehaviorTreeRoots([]);
  const twinA = makeNode({ id: "twin_a", kind: "ACTION", displayName: "A", config: { actionApi: "a" }, children: [] });
  const twinB = makeNode({ id: "twin_b", kind: "ACTION", displayName: "B", config: { actionApi: "b" }, children: [] });
  layoutBehaviorTreeRoots([twinA, twinB]);
  assert.ok(twinB._x > twinA._x);
  assert.equal(behaviorTreeIntOrNull(""), null);
  assert.equal(behaviorTreeIntOrNull("4"), 4);
  assert.equal(behaviorTreeIntOrNull("4.5"), null);
  assert.equal(behaviorTreeEmptyToNull("  "), null);
  assert.equal(behaviorTreeEmptyToNull("k"), "k");
  assert.equal(isBehaviorTreeValueLessOp("IS_EMPTY"), true);
  assert.equal(isBehaviorTreeValueLessOp("EQ"), false);
});

test("behavior tree model mutators and attach rules", () => {
  const kindMeta = createBehaviorTreeKindMetaMap();
  const model = createEmptyBehaviorTreeModel();
  const root = makeNode({
    id: "root",
    kind: "SEQUENCE",
    config: createDefaultBehaviorTreeConfig("SEQUENCE"),
    children: [
      makeNode({ id: "child_a", kind: "ACTION", config: createDefaultBehaviorTreeConfig("ACTION") }),
      makeNode({ id: "child_b", kind: "ACTION", config: createDefaultBehaviorTreeConfig("ACTION") }),
    ],
  });
  model.roots.push(root);

  assert.equal(findBehaviorTreeNode(model.roots, null), null);
  assert.equal(findBehaviorTreeNode(model.roots, "child_a")?.id, "child_a");
  assert.equal(findBehaviorTreeParent(model.roots, "child_a")?.id, "root");
  assert.equal(behaviorTreeSubtreeContains(root, "child_b"), true);
  assert.equal(behaviorTreeSubtreeContains(null, "x"), false);
  assert.equal(canAttachBehaviorTreeChild(model.roots, kindMeta, "missing", null), false);
  assert.equal(canAttachBehaviorTreeChild(model.roots, kindMeta, "child_a", null), false);
  assert.equal(canAttachBehaviorTreeChild(model.roots, kindMeta, "root", "child_a"), false);
  assert.equal(canAttachBehaviorTreeChild(model.roots, kindMeta, "child_a", "root"), false);

  const decorator = makeNode({
    id: "dec",
    kind: "INVERTER",
    config: null,
    children: [makeNode({ id: "dec_child", kind: "ACTION", config: createDefaultBehaviorTreeConfig("ACTION") })],
  });
  model.roots.push(decorator);
  assert.equal(canAttachBehaviorTreeChild(model.roots, kindMeta, "dec", null), false);

  reorderBehaviorTreeChild(model, "root", "child_a", 1);
  assert.equal(root.children[0].id, "child_b");
  assert.equal(root.children[1].id, "child_a");
  reorderBehaviorTreeChild(model, "missing", "child_a", 1);
  reorderBehaviorTreeChild(model, "root", "child_a", 5);

  assert.equal(reparentBehaviorTreeNode(model, "child_a", "missing"), false);
  assert.equal(reparentBehaviorTreeNode(model, "child_a", "root"), true);
  removeBehaviorTreeNodeFromTree(model, "dec");
  assert.equal(
    model.roots.some((item) => item.id === "dec"),
    false,
  );
  removeBehaviorTreeNodeFromTree(model, "child_b");
  assert.equal(findBehaviorTreeNode(model.roots, "child_b"), null);

  assert.deepEqual(placeOfNewBehaviorTreeNode(null, { x: 100, y: 80 }), { x: 5, y: 51 });
  assert.deepEqual(placeOfNewBehaviorTreeNode(root, null), { x: 24, y: 92 });
  assert.deepEqual(placeOfNewBehaviorTreeNode(null, null), { x: 60, y: 60 });

  const kinds = [
    "SELECTOR",
    "SEQUENCE",
    "PARALLEL",
    "REPEATER",
    "UNTIL_SUCCESS",
    "UNTIL_FAILURE",
    "COOLDOWN",
    "TIME_LIMIT",
    "BLACKBOARD_CONDITION",
    "CONDITION",
    "ACTION",
    "INVERTER",
    "FORCE_SUCCESS",
  ];
  for (const kind of kinds) {
    const config = createDefaultBehaviorTreeConfig(kind);
    if (kind === "INVERTER" || kind === "FORCE_SUCCESS") assert.equal(config, null);
    else assert.ok(config);
  }

  const occupied = [makeNode({ id: "node_1", kind: "ACTION", config: createDefaultBehaviorTreeConfig("ACTION") })];
  const seq = { value: 1 };
  assert.equal(nextBehaviorTreeNodeId(occupied, seq), "node_2");

  renameBehaviorTreeKeyRefs(model.roots, "", "x");
  renameBehaviorTreeKeyRefs(model.roots, "old", "old");
  const boardNode = makeNode({
    id: "bb",
    kind: "BLACKBOARD_CONDITION",
    config: { key: "old", op: "EQ", value: "1" },
  });
  const coolNode = makeNode({
    id: "cd",
    kind: "COOLDOWN",
    config: { intervalSeconds: "1", entityPrimaryKeyKey: "old", hitResult: "FAILURE" },
    children: [makeNode({ id: "cd_child", kind: "ACTION", config: createDefaultBehaviorTreeConfig("ACTION") })],
  });
  renameBehaviorTreeKeyRefs([boardNode, coolNode], "old", "new");
  assert.equal(boardNode.config.key, "new");
  assert.equal(coolNode.config.entityPrimaryKeyKey, "new");
});

test("behavior tree validation covers kind rules and warnings", () => {
  const kindMeta = createBehaviorTreeKindMetaMap();
  const model = createEmptyBehaviorTreeModel();
  model.blackboard.push(
    createBehaviorTreeBlackboardItem("", { valueType: "STRING" }),
    createBehaviorTreeBlackboardItem("dup", { defaultValueText: "a" }),
    createBehaviorTreeBlackboardItem("dup", { defaultValueText: "b" }),
    createBehaviorTreeBlackboardItem("badInt", { valueType: "", defaultValueText: "x" }),
    createBehaviorTreeBlackboardItem("count", { valueType: "INTEGER", defaultValueText: "nope" }),
    createBehaviorTreeBlackboardItem("label", { defaultValueText: "ok" }),
    createBehaviorTreeBlackboardItem("items", { valueType: "LIST", defaultValueText: "a,b" }),
    createBehaviorTreeBlackboardItem("fixedEmpty", { source: "FIXED", fixedValueText: "" }),
    createBehaviorTreeBlackboardItem("propMissing", { source: "PROPERTY", bindPropertyUniqueIdentifier: "" }),
  );

  const leafWithChild = makeNode({
    id: "leaf_bad",
    kind: "ACTION",
    config: { actionApi: "", timeoutSeconds: "3", retryTimes: "-1" },
    children: [makeNode({ id: "orphan", kind: "ACTION", config: createDefaultBehaviorTreeConfig("ACTION") })],
  });
  const parallel = makeNode({
    id: "par",
    kind: "PARALLEL",
    config: { policy: "", maxConcurrency: "0" },
    children: [
      makeNode({ id: "p1", kind: "ACTION", config: { actionApi: "act.ok", timeoutSeconds: "", retryTimes: "2" } }),
      makeNode({ id: "p2", kind: "ACTION", config: { actionApi: "act.missing", timeoutSeconds: "0", retryTimes: "" } }),
    ],
  });
  const repeater = makeNode({
    id: "rep",
    kind: "REPEATER",
    config: { loopMode: "INFINITE", times: "1001" },
    whileCondition: "",
    children: [makeNode({ id: "rep_child", kind: "CONDITION", config: { expression: "" } })],
  });
  const until = makeNode({
    id: "until",
    kind: "UNTIL_SUCCESS",
    config: { maxTimes: "-1", finishState: "" },
    children: [makeNode({ id: "until_child", kind: "ACTION", config: { actionApi: "act.ok", timeoutSeconds: "", retryTimes: "" } })],
  });
  const cooldown = makeNode({
    id: "cool",
    kind: "COOLDOWN",
    config: { intervalSeconds: "", entityPrimaryKeyKey: "ghost", hitResult: "" },
    children: [makeNode({ id: "cool_child", kind: "ACTION", config: { actionApi: "act.ok", timeoutSeconds: "", retryTimes: "" } })],
  });
  const timeLimit = makeNode({
    id: "tl",
    kind: "TIME_LIMIT",
    config: { limitSeconds: "", timeoutState: "" },
    children: [makeNode({ id: "tl_child", kind: "ACTION", config: { actionApi: "act.ok", timeoutSeconds: "", retryTimes: "" } })],
  });
  const boardCmp = makeNode({
    id: "bbc",
    kind: "BLACKBOARD_CONDITION",
    config: { key: "label", op: "GT", value: "" },
  });
  const boardContains = makeNode({
    id: "bbc2",
    kind: "BLACKBOARD_CONDITION",
    config: { key: "count", op: "CONTAINS", value: "x" },
  });
  const boardEmpty = makeNode({
    id: "bbc3",
    kind: "BLACKBOARD_CONDITION",
    config: { key: "", op: "", value: "" },
  });
  const boardOk = makeNode({
    id: "bbc4",
    kind: "BLACKBOARD_CONDITION",
    config: { key: "count", op: "EQ", value: "1" },
  });
  const boardIsEmpty = makeNode({
    id: "bbc5",
    kind: "BLACKBOARD_CONDITION",
    config: { key: "items", op: "IS_EMPTY", value: "" },
  });
  const inverter = makeNode({
    id: "inv",
    kind: "INVERTER",
    config: null,
    children: [],
  });
  const emptyId = makeNode({ id: "", kind: "ACTION", config: createDefaultBehaviorTreeConfig("ACTION") });
  const dupIdRoot = makeNode({
    id: "dup_root",
    kind: "SELECTOR",
    config: { runMode: "" },
    children: [
      makeNode({ id: "same", kind: "ACTION", config: { actionApi: "act.ok", timeoutSeconds: "", retryTimes: "" } }),
      makeNode({
        id: "same",
        kind: "FORCE_SUCCESS",
        config: null,
        children: [makeNode({ id: "fs_child", kind: "ACTION", config: { actionApi: "act.ok", timeoutSeconds: "", retryTimes: "" } })],
      }),
    ],
  });

  model.roots = [
    leafWithChild,
    parallel,
    repeater,
    until,
    cooldown,
    timeLimit,
    boardCmp,
    boardContains,
    boardEmpty,
    boardOk,
    boardIsEmpty,
    inverter,
    emptyId,
    dupIdRoot,
  ];
  const errors = collectBehaviorTreeErrors(model, kindMeta).join("|");
  assert.match(errors, /黑板第 1 行键名为空/);
  assert.match(errors, /黑板键名重复：dup/);
  assert.match(errors, /必须选择值类型|不符合/);
  assert.match(errors, /固定值，必须填写固定值/);
  assert.match(errors, /对象属性，必须选择属性/);
  assert.match(errors, /只能有一个根节点/);
  assert.match(errors, /叶子节点，不能有子节点|必须绑定行为|timeoutSeconds/);
  assert.match(errors, /成败判定策略|循环模式|持续执行条件|冷却时长|限时时长|比较方式|条件表达式|节点标识/);

  const fixedDefaultModel = createEmptyBehaviorTreeModel();
  fixedDefaultModel.blackboard.push(
    createBehaviorTreeBlackboardItem("fixedWithDefault", {
      valueType: "INTEGER",
      source: "FIXED",
      fixedValueText: "abc",
      defaultValueText: "1",
    }),
    createBehaviorTreeBlackboardItem("propMismatch", {
      valueType: "STRING",
      source: "PROPERTY",
      bindPropertyUniqueIdentifier: "prop.hp",
    }),
  );
  fixedDefaultModel.roots = [
    makeNode({
      id: "fixed_root",
      kind: /** @type {any} */ ("NOT_A_KIND"),
      config: null,
      children: [],
    }),
  ];
  const patchedMeta = {
    ...kindMeta,
    NOT_A_KIND: { kind: /** @type {any} */ ("NOT_A_KIND"), name: "未知", category: "LEAF", maxChildren: 0 },
  };
  const fixedErrors = collectBehaviorTreeErrors(fixedDefaultModel, patchedMeta, {
    "prop.hp": { id: "prop.hp", objectId: "obj.tank", displayName: "生命", propertyType: "Int" },
  }).join("|");
  assert.match(fixedErrors, /清空默认值再保存/);
  assert.match(fixedErrors, /固定值不符合/);
  assert.match(fixedErrors, /类型与绑定属性/);
  assert.match(fixedErrors, /未知节点类型/);

  const warnModel = createEmptyBehaviorTreeModel();
  warnModel.blackboard.push(
    createBehaviorTreeBlackboardItem("k", {
      valueType: "INTEGER",
      defaultValueText: "1",
    }),
  );
  warnModel.roots = [
    makeNode({
      id: "root",
      kind: "SEQUENCE",
      config: createDefaultBehaviorTreeConfig("SEQUENCE"),
      children: [
        makeNode({
          id: "par",
          kind: "PARALLEL",
          config: { policy: "ALL_SUCCESS", maxConcurrency: "12" },
          children: [
            makeNode({ id: "act1", kind: "ACTION", config: { actionApi: "act.ok", timeoutSeconds: "", retryTimes: "2" } }),
            makeNode({
              id: "rep",
              kind: "REPEATER",
              config: { loopMode: "FIXED_TIMES", times: "1001" },
              children: [makeNode({ id: "act2", kind: "ACTION", config: { actionApi: "act.missing", timeoutSeconds: "", retryTimes: "" } })],
            }),
          ],
        }),
      ],
    }),
  ];
  const warnings = collectBehaviorTreeWarnings(warnModel, [{ actionApi: "act.ok", displayName: "ok", externalParams: [] }]);
  assert.match(warnings.join("|"), /8 路封顶|超过 1000|重试|不在当前目录/);
  assert.deepEqual(
    collectBehaviorTreeWarnings(warnModel, []),
    warnings.filter((item) => !item.includes("不在当前目录")),
  );
});

test("behavior tree definition configs serialize every kind", () => {
  const kindMeta = createBehaviorTreeKindMetaMap();
  const typeOf = (key) => (key === "count" ? "INTEGER" : key === "label" ? "STRING" : null);
  const cases = [
    makeNode({ kind: "SELECTOR", config: { runMode: "MEMORY" } }),
    makeNode({ kind: "PARALLEL", config: { policy: "ANY_SUCCESS", maxConcurrency: "2" } }),
    makeNode({ kind: "REPEATER", config: { loopMode: "FIXED_TIMES", times: "3" } }),
    makeNode({ kind: "UNTIL_FAILURE", config: { maxTimes: "1", finishState: "SUCCESS" } }),
    makeNode({ kind: "COOLDOWN", config: { intervalSeconds: "5", entityPrimaryKeyKey: "pk", hitResult: "SUCCESS" } }),
    makeNode({ kind: "TIME_LIMIT", config: { limitSeconds: "9", timeoutState: "SUCCESS" } }),
    makeNode({ kind: "BLACKBOARD_CONDITION", config: { key: "count", op: "EQ", value: "2" } }),
    makeNode({ kind: "BLACKBOARD_CONDITION", config: { key: "label", op: "IS_EMPTY", value: "" } }),
    makeNode({ kind: "CONDITION", config: { expression: "a > 1" } }),
    makeNode({ kind: "ACTION", config: { actionApi: "act.x", timeoutSeconds: "0", retryTimes: "1" } }),
    makeNode({ kind: "INVERTER", config: null }),
  ];
  for (const node of cases) {
    const config = buildBehaviorTreeNodeConfig(node, typeOf);
    if (node.kind === "INVERTER") assert.equal(config, null);
    else assert.ok(config);
    const draft = behaviorTreeConfigToDraft(node.kind, config);
    if (node.kind === "INVERTER") assert.equal(draft, null);
    else assert.ok(draft);
  }
  assert.ok(behaviorTreeConfigToDraft("FORCE_SUCCESS", null) === null || typeof behaviorTreeConfigToDraft("FORCE_SUCCESS", null) === "object");

  const nested = makeNode({
    id: "root",
    kind: "SEQUENCE",
    config: createDefaultBehaviorTreeConfig("SEQUENCE"),
    whileCondition: "keepGoing",
    children: [
      makeNode({
        id: "child",
        kind: "ACTION",
        config: { actionApi: "act.x", timeoutSeconds: "", retryTimes: "" },
      }),
      makeNode({
        id: "child2",
        kind: "ACTION",
        config: { actionApi: "act.y", timeoutSeconds: "", retryTimes: "" },
      }),
    ],
  });
  layoutBehaviorTreeRoots([nested]);
  assert.ok(typeof nested._x === "number");
  assert.ok(nested.children[0]._y > nested._y);

  const imported = importBehaviorTreeSerializedNode({
    id: "n1",
    kind: "PARALLEL",
    displayName: "",
    enabled: false,
    config: { policy: "ALL_SUCCESS", maxConcurrency: 3 },
    children: [],
  });
  assert.equal(imported.enabled, false);
  assert.equal(imported.config.maxConcurrency, "3");

  const emptyDefinition = importBehaviorTreeDefinition({ blackboard: null, variables: null, roots: null });
  assert.deepEqual(emptyDefinition.roots, []);
  assert.deepEqual(emptyDefinition.blackboard, []);
});

test("behavior tree persistence helpers choose method and extract TREE definition", () => {
  assert.equal(resolveBehaviorTreeSaveMethod(false), "POST");
  assert.equal(resolveBehaviorTreeSaveMethod(true), "PUT");

  const definition = {
    blackboard: [{ key: "ammo", valueType: "INTEGER", source: "EXTERNAL", description: "弹药" }],
    variables: [{ name: "ammo", valueType: "INTEGER", scope: "RUNTIME", defaultValue: 1 }],
    roots: [
      {
        id: "node_1",
        kind: "ACTION",
        displayName: "行为节点",
        enabled: true,
        config: { actionApi: "act.demo.ping", timeoutSeconds: null, retryTimes: null },
        children: [],
      },
    ],
  };
  const extracted = extractBehaviorTreeDefinitionFromDetail({
    id: 9,
    actionApi: "tree.ammo.check",
    displayName: "弹药检查",
    ontologyUniqIdentifier: "",
    categoryId: 14,
    status: 2,
    actionKind: "TREE",
    treeDefinition: definition,
  });
  assert.equal(extracted.roots[0].kind, "ACTION");
  assert.throws(
    () =>
      extractBehaviorTreeDefinitionFromDetail({
        id: 1,
        actionApi: "act.x",
        displayName: "x",
        ontologyUniqIdentifier: "",
        categoryId: 1,
        status: 1,
        actionKind: "BASE",
      }),
    /不是行为树/,
  );
  assert.throws(
    () =>
      extractBehaviorTreeDefinitionFromDetail({
        id: 2,
        actionApi: "tree.x",
        displayName: "x",
        ontologyUniqIdentifier: "",
        categoryId: 1,
        status: 2,
        actionKind: "TREE",
      }),
    /没有 treeDefinition/,
  );
});

test("behavior tree orchestration phase-two save load and persist wiring exist", () => {
  assert.equal(existsSync(new URL("../src/views/BehaviorTreeOrchestration/BehaviorTreeOrchestrationDialog.vue", import.meta.url)), true);
  assert.equal(existsSync(new URL("../src/apis/behaviorTreeApi.ts", import.meta.url)), true);
  const apiSource = readSource("../src/apis/behaviorTreeApi.ts");
  assert.match(apiSource, /getActionTreeNodeDefsInterface/);
  assert.match(apiSource, /postCreateBehaviorTreeActionInterface/);
  assert.match(apiSource, /putUpdateBehaviorTreeActionInterface/);
  assert.match(apiSource, /\/ontology\/action\/tree\/node-defs/);
  assert.match(apiSource, /method: "post"/);
  assert.match(apiSource, /method: "put"/);
  const dialogSource = readSource("../src/views/BehaviorTreeOrchestration/BehaviorTreeOrchestrationDialog.vue");
  assert.match(dialogSource, /fullscreen/);
  assert.match(dialogSource, /BehaviorTreePalette/);
  assert.match(dialogSource, /BehaviorTreeNodeInspector/);
  assert.match(dialogSource, /BehaviorTreeBlackboardPanel/);
  assert.match(dialogSource, /BehaviorTreeExecPanel/);
  assert.match(dialogSource, /执行 \/ 日志/);
  assert.match(dialogSource, /useBehaviorTreeExecution/);
  assert.doesNotMatch(dialogSource, /BehaviorTreeJsonPanel|导入\/导出|定义 JSON/);
  assert.doesNotMatch(dialogSource, /空间 \{\{ meta\.spaceId \}\}|分类 \{\{ meta\.categoryId \}\}/);
  assert.equal(existsSync(new URL("../src/views/BehaviorTreeOrchestration/components/BehaviorTreeJsonPanel.vue", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/views/BehaviorTreeOrchestration/components/BehaviorTreeExecPanel.vue", import.meta.url)), true);
  assert.equal(existsSync(new URL("../src/views/BehaviorTreeOrchestration/composables/useBehaviorTreeExecution.ts", import.meta.url)), true);
  assert.match(dialogSource, /object-options|object-properties|loadBehaviorTreeObjectPropertyCatalog/);
  assert.match(dialogSource, /ensureBehaviorTreeObjectProperties|request-object-properties/);
  const boardSource = readSource("../src/views/BehaviorTreeOrchestration/components/BehaviorTreeBlackboardPanel.vue");
  assert.match(boardSource, /BEHAVIOR_TREE_BLACKBOARD_SOURCE_OPTIONS/);
  assert.match(boardSource, /behavior-tree-board__card/);
  assert.doesNotMatch(boardSource, /<el-table\b/);
  assert.match(boardSource, /先选择对象|handleObjectChange|listPropertiesForObject/);
  assert.match(boardSource, /request-object-properties/);
  assert.match(boardSource, /objectPropertyLoadingIds|isObjectPropertyLoading/);
  assert.match(boardSource, /固定值|默认值/);
  const orchestrationSource = readSource("../src/views/BehaviorTreeOrchestration/composables/useBehaviorTreeOrchestration.ts");
  assert.match(orchestrationSource, /getOntologyCategoryTreeInterface/);
  assert.match(orchestrationSource, /objectOptions\.value = mapOntologyObjectsToRelationOptions/);
  assert.match(orchestrationSource, /ensureBehaviorTreeObjectProperties/);
  assert.match(orchestrationSource, /getOntologyPropertyByOntologyIdInterface/);
  assert.doesNotMatch(orchestrationSource, /Promise\.all\(\s*objects\.map/);
  assert.match(orchestrationSource, /loadedObjectPropertyIds|objectPropertyLoadingIds/);
  const graphSource = readSource("../src/views/BehaviorTreeOrchestration/composables/useBehaviorTreeGraph.ts");
  assert.match(graphSource, /targetMarker/);
  assert.match(graphSource, /buildBehaviorTreeEdgeTerminals/);
  assert.match(graphSource, /connectionPoint:\s*\{\s*name:\s*['"]anchor['"][\s\S]*dy:\s*18/);
  assert.match(graphSource, /connectionPoint:\s*\{\s*name:\s*['"]anchor['"][\s\S]*dy:\s*-14/);
  assert.match(graphSource, /padding:\s*18/);
  assert.match(graphSource, /port: ['"]out['"]/);
  assert.match(graphSource, /port: ['"]in['"]/);
  assert.match(graphSource, /id: ['"]in['"]/);
  assert.match(graphSource, /createEdge/);
  assert.match(graphSource, /mousewheel:\s*\{[^}]*enabled:\s*true/);
  assert.doesNotMatch(graphSource, /mousewheel:\s*\{[^}]*modifiers/);
  assert.doesNotMatch(graphSource, new RegExp("targetMarker:[\\s\\S]*offset:\\s*[1-9]"));
  assert.match(dialogSource, /saveBehaviorTreeAction/);
  assert.match(dialogSource, /hasPersisted \? "更新" : "保存"/);
  assert.match(dialogSource, /loadBehaviorTreeDetail/);
  assert.match(dialogSource, /persisted/);
  assert.doesNotMatch(dialogSource, /saveBehaviorTreePlaceholder/);
  assert.doesNotMatch(dialogSource, /节点说明|btnPublish|拉节点目录|加载已有树/);
  const composableSource = readSource("../src/views/BehaviorTreeOrchestration/composables/useBehaviorTreeOrchestration.ts");
  assert.match(composableSource, /postCreateBehaviorTreeActionInterface/);
  assert.match(composableSource, /putUpdateBehaviorTreeActionInterface/);
  assert.match(composableSource, /getOntologyActionInfoInterface/);
  assert.match(composableSource, /resolveBehaviorTreeSaveMethod/);
  const typeSource = readSource("../src/types/apis/getOntologyActionInfoType.ts");
  assert.match(typeSource, /treeDefinition\?/);
  assert.match(typeSource, /executeInputs\?/);
  assert.match(typeSource, /BehaviorTreeExecuteInputs/);
  const treeTestTypeSource = readSource("../src/types/apis/postOntologyActionTreeTestType.ts");
  assert.match(treeTestTypeSource, /PostOntologyActionTreeTestParams/);
  assert.match(treeTestTypeSource, /nodeExecutes/);
  assert.match(apiSource, /postOntologyActionTreeTestInterface/);
  assert.match(apiSource, /\/ontology\/action\/tree\/test/);
  const execComposableSource = readSource("../src/views/BehaviorTreeOrchestration/composables/useBehaviorTreeExecution.ts");
  assert.match(execComposableSource, /loadBehaviorTreeExecutePlan/);
  assert.match(execComposableSource, /runBehaviorTreeTest/);
  assert.match(execComposableSource, /postOntologyActionTreeTestInterface/);
  const execPanelSource = readSource("../src/views/BehaviorTreeOrchestration/components/BehaviorTreeExecPanel.vue");
  assert.match(execPanelSource, /读取执行要求/);
  assert.match(execPanelSource, /试跑 tree\/test/);
  assert.match(execPanelSource, /接口日志/);
  const routesSource = readSource("../src/mockData/routes.json");
  assert.match(routesSource, /\/ontology\/action\/tree\/node-defs/);
  const formSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue");
  assert.match(formSource, /openBehaviorTreeOrchestration/);
  assert.match(formSource, /BehaviorTreeOrchestrationDialog/);
  assert.match(formSource, /handleBehaviorTreePersisted/);
  assert.match(formSource, /tree-persisted/);
  const workspaceSource = readSource("../src/views/SpaceBehaviorWorkspace/index.vue");
  assert.match(workspaceSource, /handleBehaviorTreePersisted/);
  assert.match(workspaceSource, /loadSpaceBehaviorWorkspace/);
  const inspectorSource = readSource("../src/views/BehaviorTreeOrchestration/components/BehaviorTreeNodeInspector.vue");
  assert.match(inspectorSource, /isCompositeNode/);
  assert.match(inspectorSource, /子节点顺序/);
  assert.match(inspectorSource, /behavior-tree-node-inspector__child-order/);
  assert.doesNotMatch(inspectorSource, /同级顺序/);
});

test("behavior tree execute plan builds payload and reports missing fields", () => {
  const plan = {
    inputParams: [
      { key: "threshold", valueType: "INTEGER", nodeIds: ["node_action_1"] },
      { key: "orphan", valueType: "STRING", nodeIds: [] },
    ],
    instanceRequirements: [
      { objectIdentifier: "obj.tank", nodeIds: ["node_action_1"] },
      {
        objectIdentifier: "obj.tank",
        nodeIds: ["node_link_1"],
        linkEntityPrimaryKeyRequired: true,
        linkFromObjectIdentifier: "obj.tank",
        linkToObjectIdentifier: "obj.base",
      },
      { objectIdentifier: "obj.tank", blackboardKeys: ["ammo"], nodeIds: [] },
      {
        objectIdentifier: "obj.tank",
        nodeIds: ["node_legacy_link"],
        linkEntityPrimaryKeyRequired: true,
        linkObjectIdentifier: "obj.base",
      },
    ],
    outputParams: [
      { key: "prop.hp", mode: "DATA_PRIMARY_KEY", storageGroup: "hp_row", nodeIds: ["node_action_1"], objectIdentifier: "obj.tank" },
      { key: "prop.out", mode: "OUTPUT_PARAM", storageGroup: "sub", objectIdentifier: "obj.tank", nodeIds: ["node_multi_1"] },
      { key: "prop.result", mode: "RESULT_ONLY", nodeIds: ["node_multi_1"] },
    ],
  };
  assert.deepEqual(listBehaviorTreeExecPlanNodeIds(plan), ["node_action_1", "node_legacy_link", "node_link_1", "node_multi_1"]);
  assert.deepEqual(listBehaviorTreeExecPlanObjectIds(plan).sort(), ["obj.base", "obj.tank"]);
  assert.deepEqual(
    resolveBehaviorTreeNodeLinkEnds([
      {
        linkEntityPrimaryKeyRequired: true,
        linkFromObjectIdentifier: "obj.tank",
        linkToObjectIdentifier: "obj.base",
      },
    ]),
    { from: "obj.tank", to: "obj.base", self: false },
  );

  const drafts = {
    node_action_1: createBehaviorTreeNodeExecDraft(),
    node_link_1: createBehaviorTreeNodeExecDraft(),
    node_legacy_link: createBehaviorTreeNodeExecDraft(),
    node_multi_1: createBehaviorTreeNodeExecDraft(),
  };
  const missing = collectBehaviorTreeExecMissingFields({
    plan,
    objectLabelById: { "obj.tank": "坦克", "obj.base": "基地" },
    blackboardObjectKeys: {},
    nodeDrafts: drafts,
  });
  assert.ok(missing.some((item) => item.includes("threshold")));
  assert.ok(missing.some((item) => item.includes("行为入参 orphan")));
  assert.ok(missing.some((item) => item.includes("黑板属性")));
  assert.ok(missing.some((item) => item.includes("实例")));
  assert.ok(missing.some((item) => item.includes("关系两端")));
  assert.ok(missing.some((item) => item.includes("关系对端")));
  assert.ok(missing.some((item) => item.includes("行主键")));
  assert.deepEqual(collectBehaviorTreeExecMissingFields({ plan: null, blackboardObjectKeys: {}, nodeDrafts: {} }), []);

  drafts.node_action_1.params.threshold = "3";
  drafts.node_action_1.entityPrimaryKey = "tank-1";
  drafts.node_action_1.outputParams["prop.hp"] = { entityPrimaryKey: "", rowKey: "row-9" };
  drafts.node_action_1.inputParams.speed = { entityPrimaryKey: "tank-1", rows: { speed_row: "r1", empty: "" } };
  drafts.node_link_1.entityPrimaryKeys.from = "tank-1";
  drafts.node_link_1.entityPrimaryKeys.to = "base-2";
  drafts.node_legacy_link.entityPrimaryKeys["obj.base"] = "base-9";
  drafts.node_multi_1.entityPrimaryKeys = { "obj.a": "a1", "obj.b": "b2" };
  drafts.node_multi_1.outputParams["prop.out"] = { entityPrimaryKey: "tank-1", rowKey: "out-1" };

  const multiPlan = {
    ...plan,
    instanceRequirements: [
      ...plan.instanceRequirements,
      { objectIdentifier: "obj.a", nodeIds: ["node_multi_1"] },
      { objectIdentifier: "obj.b", nodeIds: ["node_multi_1"] },
    ],
  };

  const built = buildBehaviorTreeTestPayload({
    spaceId: "100",
    treeApi: "tree.demo",
    plan: multiPlan,
    blackboard: [
      createBehaviorTreeBlackboardItem("ammoCount", {
        valueType: "INTEGER",
        source: "EXTERNAL",
        defaultValueText: "1",
      }),
      createBehaviorTreeBlackboardItem("bad", {
        valueType: "INTEGER",
        source: "EXTERNAL",
      }),
      createBehaviorTreeBlackboardItem("", { source: "EXTERNAL" }),
      createBehaviorTreeBlackboardItem("fixedSkip", { source: "FIXED", fixedValueText: "1", valueType: "INTEGER" }),
    ],
    objectProperties: {},
    externalInputDraft: { ammoCount: "7", bad: "" },
    blackboardObjectKeys: { "obj.tank": "tank-bb", "obj.empty": "  " },
    nodeDrafts: drafts,
  });
  assert.equal("payload" in built, true);
  if (!("payload" in built)) return;
  assert.equal(built.payload.treeApi, "tree.demo");
  assert.equal(built.payload.inputs?.ammoCount, 7);
  assert.equal(built.payload.entityPrimaryKeys?.["obj.tank"], "tank-bb");
  assert.equal(built.payload.nodeExecutes?.node_action_1?.params?.threshold, 3);
  assert.equal(built.payload.nodeExecutes?.node_action_1?.entityPrimaryKey, "tank-1");
  assert.equal(built.payload.nodeExecutes?.node_action_1?.dataPrimaryKey, "row-9");
  assert.deepEqual(built.payload.nodeExecutes?.node_action_1?.inputParams?.speed, {
    entityPrimaryKey: "tank-1",
    dataPrimaryKeys: { speed_row: "r1" },
  });
  assert.deepEqual(built.payload.nodeExecutes?.node_link_1?.entityPrimaryKeys, { from: "tank-1", to: "base-2" });
  assert.deepEqual(built.payload.nodeExecutes?.node_multi_1?.entityPrimaryKeys, { "obj.a": "a1", "obj.b": "b2" });
  assert.deepEqual(built.payload.nodeExecutes?.node_multi_1?.outputParams?.["prop.out"], {
    entityPrimaryKey: "tank-1",
    dataPrimaryKeys: { sub: "out-1" },
  });

  const badInputs = buildBehaviorTreeTestPayload({
    spaceId: "100",
    treeApi: "tree.demo",
    plan,
    blackboard: [createBehaviorTreeBlackboardItem("ammoCount", { valueType: "INTEGER", source: "EXTERNAL" })],
    objectProperties: {},
    externalInputDraft: { ammoCount: "nope" },
    blackboardObjectKeys: {},
    nodeDrafts: drafts,
  });
  assert.equal("error" in badInputs, true);

  drafts.node_action_1.params.threshold = "x";
  const badParam = buildBehaviorTreeTestPayload({
    spaceId: "100",
    treeApi: "tree.demo",
    plan,
    blackboard: [],
    objectProperties: {},
    externalInputDraft: {},
    blackboardObjectKeys: {},
    nodeDrafts: drafts,
  });
  assert.equal("error" in badParam, true);

  const nested = makeNode({
    id: "root",
    kind: "SEQUENCE",
    displayName: "根",
    children: [
      makeNode({
        id: "node_action_1",
        kind: "ACTION",
        displayName: "开火",
        config: { actionApi: "app.fire" },
        children: [],
      }),
    ],
  });
  assert.equal(resolveBehaviorTreeNodeDisplayName([nested], "node_action_1"), "开火");
  assert.equal(resolveBehaviorTreeNodeDisplayName([nested], "missing"), "missing");
  assert.deepEqual(mapBehaviorTreeBoundActionApis([nested]), { node_action_1: "app.fire" });
  assert.equal(mapBehaviorTreeEntityRecordOption({ primaryKey: 1, displayName: "甲" })?.label, "甲 · 1");
  assert.equal(mapBehaviorTreeEntityRecordOption({ entityPrimaryKey: "k2", name: "乙" })?.label, "乙 · k2");
  assert.equal(mapBehaviorTreeEntityRecordOption({ id: "k3" })?.label, "k3");
  assert.equal(mapBehaviorTreeEntityRecordOption({ primaryKey: "" }), null);
  assert.equal(mapBehaviorTreeEntityRecordOption({}), null);

  assert.deepEqual(listBehaviorTreeExecPlanNodeIds(null), []);
  assert.deepEqual(listBehaviorTreeExecPlanObjectIds(undefined), []);
  assert.deepEqual(
    resolveBehaviorTreeNodeLinkEnds([
      { linkEntityPrimaryKeyRequired: true, linkFromObjectIdentifier: "obj.self", selfRelation: true },
      { linkEntityPrimaryKeyRequired: false },
    ]),
    { from: "obj.self", to: "obj.self", self: true },
  );
  assert.equal(resolveBehaviorTreeNodeLinkEnds([{ linkEntityPrimaryKeyRequired: true }]), null);

  const unnamed = makeNode({ id: "node_blank", kind: "ACTION", displayName: "  ", config: { actionApi: "" }, children: [] });
  assert.equal(resolveBehaviorTreeNodeDisplayName([unnamed], "node_blank"), "node_blank");
  assert.deepEqual(mapBehaviorTreeBoundActionApis([unnamed]), {});

  drafts.node_action_1.params.threshold = "3";
  drafts.node_action_1.inputParams.onlyRows = { entityPrimaryKey: "", rows: { g1: "row-a" } };
  drafts.node_multi_1.outputParams["prop.out"] = { entityPrimaryKey: "tank-1", rowKey: "" };
  const outputOnly = buildBehaviorTreeTestPayload({
    spaceId: "100",
    treeApi: "tree.demo",
    plan: {
      inputParams: [],
      instanceRequirements: [],
      outputParams: [
        { key: "prop.out", mode: "OUTPUT_PARAM", objectIdentifier: "obj.tank", nodeIds: ["node_multi_1"] },
        { mode: "OUTPUT_PARAM", nodeIds: ["node_multi_1"] },
      ],
    },
    blackboard: [],
    objectProperties: { ignore: { id: "ignore", objectId: "obj.tank", displayName: "x", propertyType: "STRING" } },
    externalInputDraft: {},
    blackboardObjectKeys: {},
    nodeDrafts: {
      node_multi_1: drafts.node_multi_1,
      node_action_1: drafts.node_action_1,
    },
  });
  assert.equal("payload" in outputOnly, true);
  if ("payload" in outputOnly) {
    assert.deepEqual(outputOnly.payload.nodeExecutes?.node_multi_1?.outputParams?.["prop.out"], { entityPrimaryKey: "tank-1" });
  }
});
