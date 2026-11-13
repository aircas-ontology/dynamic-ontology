import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { createBehaviorTreeKindMetaMap, isBehaviorTreeValueLessOp } from "../src/views/BehaviorTreeOrchestration/utils/behaviorTreeConstants.ts";
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
  assert.deepEqual(collectBehaviorTreeErrors(model, kindMeta), ["行为树至少要有一个黑板键", "行为树必须且只能有一个根节点，当前 0 个"]);

  model.blackboard.push({
    key: "ammoCount",
    valueType: "INTEGER",
    bindPropertyUniqueIdentifier: "",
    defaultValueText: "3",
    description: "",
  });
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
});

test("behavior tree definition round-trips and builds TREE payload", () => {
  const kindMeta = createBehaviorTreeKindMetaMap();
  const model = createEmptyBehaviorTreeModel();
  model.blackboard.push({
    key: "ammoCount",
    valueType: "INTEGER",
    bindPropertyUniqueIdentifier: "prop.ammo",
    defaultValueText: "1",
    description: "弹药",
  });
  model.roots.push(
    makeNode({
      id: "node_1",
      kind: "ACTION",
      displayName: "行为节点",
      skipIf: "ammoCount > 0",
      whileCondition: "",
      config: { actionApi: "act.demo.ping", timeoutSeconds: "", retryTimes: "" },
    }),
  );
  layoutBehaviorTreeRoots(model.roots);
  const definition = buildBehaviorTreeDefinition(model, kindMeta);
  assert.equal(definition.roots.length, 1);
  assert.equal(definition.roots[0].config.actionApi, "act.demo.ping");
  assert.equal(definition.roots[0].skipIf, "ammoCount > 0");
  const restored = importBehaviorTreeDefinition(definition);
  assert.equal(restored.blackboard[0].key, "ammoCount");
  assert.equal(restored.roots[0].kind, "ACTION");

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
  assert.equal(parseBehaviorTreeTypedValue("nope", "OBJECT").ok, false);
  assert.equal(parseBehaviorTreeTypedValue("x", "UNKNOWN").ok, true);
  assert.equal(behaviorTreeValueToText(null), "");
  assert.equal(behaviorTreeValueToText({ a: 1 }), '{"a":1}');
  assert.equal(behaviorTreeValueToText(3), "3");
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
    { key: "", valueType: "STRING", bindPropertyUniqueIdentifier: "", defaultValueText: "", description: "" },
    { key: "dup", valueType: "STRING", bindPropertyUniqueIdentifier: "", defaultValueText: "a", description: "" },
    { key: "dup", valueType: "STRING", bindPropertyUniqueIdentifier: "", defaultValueText: "b", description: "" },
    { key: "badInt", valueType: "", bindPropertyUniqueIdentifier: "", defaultValueText: "x", description: "" },
    { key: "count", valueType: "INTEGER", bindPropertyUniqueIdentifier: "", defaultValueText: "nope", description: "" },
    { key: "label", valueType: "STRING", bindPropertyUniqueIdentifier: "", defaultValueText: "ok", description: "" },
    { key: "items", valueType: "LIST", bindPropertyUniqueIdentifier: "", defaultValueText: "a,b", description: "" },
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
  assert.match(errors, /只能有一个根节点/);
  assert.match(errors, /叶子节点，不能有子节点|必须绑定行为|timeoutSeconds/);
  assert.match(errors, /成败判定策略|循环模式|持续执行条件|冷却时长|限时时长|比较方式|条件表达式|节点标识/);

  const warnModel = createEmptyBehaviorTreeModel();
  warnModel.blackboard.push({
    key: "k",
    valueType: "INTEGER",
    bindPropertyUniqueIdentifier: "",
    defaultValueText: "1",
    description: "",
  });
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
    blackboard: [{ key: "ammo", valueType: "INTEGER", bindPropertyUniqueIdentifier: null, description: null }],
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
  assert.match(dialogSource, /BehaviorTreeJsonPanel/);
  assert.match(dialogSource, /saveBehaviorTreeAction/);
  assert.match(dialogSource, /hasPersisted \? "更新" : "保存"/);
  assert.match(dialogSource, /loadBehaviorTreeDetail/);
  assert.match(dialogSource, /persisted/);
  assert.doesNotMatch(dialogSource, /saveBehaviorTreePlaceholder/);
  assert.doesNotMatch(dialogSource, /执行 \/ 日志|节点说明|btnPublish|拉节点目录|加载已有树/);
  const composableSource = readSource("../src/views/BehaviorTreeOrchestration/composables/useBehaviorTreeOrchestration.ts");
  assert.match(composableSource, /postCreateBehaviorTreeActionInterface/);
  assert.match(composableSource, /putUpdateBehaviorTreeActionInterface/);
  assert.match(composableSource, /getOntologyActionInfoInterface/);
  assert.match(composableSource, /resolveBehaviorTreeSaveMethod/);
  const typeSource = readSource("../src/types/apis/getOntologyActionInfoType.ts");
  assert.match(typeSource, /treeDefinition\?/);
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
