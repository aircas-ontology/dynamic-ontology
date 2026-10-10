import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  cloneRuleFlowValue,
  cloneScheduleRuleFlow,
  createActionsStep,
  createBranchStep,
  createDefaultScheduleRuleFlow,
  createEmptyCompositeCondition,
  createEmptyThenAction,
  createSwitchStep,
  summarizeRuleCondition,
  summarizeThenAction,
  summarizeValue,
  truncateRuleFlowText,
} from "../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory.ts";
import { generateScheduleRuleFromPrompt } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleAiGenerate.ts";
import { parseScheduleRuleFlow, serializeScheduleRuleFlow } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowText.ts";
import {
  createCustomRuleVariableObject,
  createCustomRuleVariableProperty,
  deleteCustomRuleVariableObject,
  deleteCustomRuleVariableProperty,
  filterCustomRuleVariableCatalog,
  listCustomRuleVariableCatalog,
  resetCustomRuleVariableCatalog,
  updateCustomRuleVariableObject,
  updateCustomRuleVariableProperty,
} from "../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleVariableCatalog.ts";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
function readSource(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
}

/**
 * @description 统计源文件行数，校验单个 Vue 文件不超过 500 行。
 * @param source 文件文本。
 * @returns 行数。
 */
function countSourceLines(source) {
  return source.split(/\r?\n/).length;
}

const vueFiles = [
  "../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleRuleConfigDialog.vue",
  "../src/views/SpaceBehaviorScheduleWorkspace/CustomRuleVariableDialog.vue",
  "../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/CustomRuleVariableEditors.vue",
  "../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowCodeEditor.vue",
  "../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleAiChatPanel.vue",
];

test("rule config header opens custom variable, code, and AI surfaces", () => {
  const dialogSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleRuleConfigDialog.vue");
  const variableSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/CustomRuleVariableDialog.vue");
  const editorSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/CustomRuleVariableEditors.vue");
  const codeSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowCodeEditor.vue");
  const aiSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleAiChatPanel.vue");
  const typeSource = readSource("../src/types/pages/ontologySpaceBehaviorScheduleType.ts");
  const typesIndex = readSource("../src/types/index.ts");

  assert.match(dialogSource, />自定义变量</);
  assert.match(dialogSource, /收起代码|规则代码/);
  assert.match(dialogSource, /收起 AI|AI 生成规则/);
  assert.match(dialogSource, /data-code-open/);
  assert.match(dialogSource, /ScheduleRuleFlowCodeEditor/);
  assert.match(dialogSource, /ScheduleRuleAiChatPanel/);
  assert.match(dialogSource, /CustomRuleVariableDialog/);
  assert.match(dialogSource, /serializeScheduleRuleFlow/);
  assert.match(dialogSource, /parseScheduleRuleFlow/);

  assert.match(variableSource, /自定义变量管理/);
  assert.match(variableSource, /搜索变量或键/);
  assert.match(variableSource, /\+ 添加变量/);
  assert.match(variableSource, /\+ 添加键/);
  assert.match(variableSource, /aircas-table/);
  assert.match(variableSource, /aircas-tag|value-type-/);
  assert.match(variableSource, />关闭</);
  assert.match(variableSource, /:z-index="5100"/);
  assert.match(variableSource, /添加自定义变量/);
  assert.match(variableSource, /编辑自定义变量/);
  assert.match(variableSource, /添加键/);
  assert.match(variableSource, /编辑键/);
  assert.match(editorSource, /objectTitle/);
  assert.match(editorSource, /propertyTitle/);

  assert.match(codeSource, /与左侧可视化双向同步/);
  assert.match(codeSource, /monaco-editor/);
  assert.match(codeSource, /\.dispose\(\)/);

  assert.match(aiSource, /AI 生成规则/);
  assert.match(aiSource, /SCHEDULE_RULE_AI_PRESET_PROMPTS/);
  assert.match(aiSource, /同步到规则/);
  assert.match(aiSource, />上传</);
  assert.match(aiSource, />发送</);
  assert.match(aiSource, />收起</);
  assert.match(aiSource, /maxlength="500"|SCHEDULE_RULE_AI_PROMPT_MAX_LENGTH/);
  assert.match(typeSource, /RuleVariableCatalogObject/);
  assert.match(typeSource, /ScheduleRuleAiMessage/);
  assert.match(typesIndex, /RuleVariableCatalogObject/);
  assert.match(typesIndex, /SCHEDULE_RULE_AI_PRESET_PROMPTS/);
});

test("each header-panel Vue file stays at or under 500 lines", () => {
  for (const relativePath of vueFiles) {
    const source = readSource(relativePath);
    const lineCount = countSourceLines(source);
    assert.ok(lineCount <= 500, `${relativePath} has ${lineCount} lines`);
  }
});

test("custom variable catalog seeds screenshot samples and supports in-memory crud", () => {
  resetCustomRuleVariableCatalog();
  const seeded = listCustomRuleVariableCatalog();
  assert.deepEqual(
    seeded.map((item) => item.name),
    ["全局任务上下文", "系统运行参数", "环境阈值"],
  );
  const context = seeded[0];
  assert.ok(context);
  assert.deepEqual(
    context.properties.map((item) => item.name),
    ["任务优先级", "当前阶段", "告警开关", "值班席位"],
  );
  const alarm = context.properties.find((item) => item.name === "告警开关");
  assert.equal(alarm?.valueType, "boolean");

  const filtered = filterCustomRuleVariableCatalog("优先级");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.name, "全局任务上下文");

  const created = createCustomRuleVariableObject("临时变量");
  assert.equal(created.name, "临时变量");
  const renamed = updateCustomRuleVariableObject(created.id, "临时变量乙");
  assert.equal(renamed.name, "临时变量乙");
  const property = createCustomRuleVariableProperty(created.id, "开关", "boolean");
  assert.equal(property.name, "开关");
  const nested = createCustomRuleVariableProperty(created.id, "上下文", "object", [{ id: "child-a", name: "子键", valueType: "string" }]);
  assert.equal(nested.children?.[0]?.name, "子键");
  const updated = updateCustomRuleVariableProperty(created.id, property.id, "告警", "boolean");
  assert.equal(updated.name, "告警");
  assert.equal(deleteCustomRuleVariableProperty(created.id, property.id), true);
  assert.equal(deleteCustomRuleVariableObject(created.id), true);
  assert.equal(
    listCustomRuleVariableCatalog().some((item) => item.id === created.id),
    false,
  );
  assert.equal(deleteCustomRuleVariableObject("missing"), false);
  assert.throws(() => updateCustomRuleVariableObject("missing", "x"));
  assert.throws(() => createCustomRuleVariableProperty("missing", "x", "string"));
  assert.throws(() => updateCustomRuleVariableProperty("missing", "x", "x", "string"));
  assert.equal(deleteCustomRuleVariableProperty("missing", "x"), false);
  assert.equal(filterCustomRuleVariableCatalog("").length, 3);
  resetCustomRuleVariableCatalog();
});

test("rule flow text serializes and parses a default canvas document", () => {
  resetCustomRuleVariableCatalog();
  const original = createDefaultScheduleRuleFlow();
  const text = serializeScheduleRuleFlow(original);
  assert.match(text, /^IF/m);
  assert.match(text, /THEN/);
  const parsed = parseScheduleRuleFlow(text, listCustomRuleVariableCatalog());
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.doc.steps[0]?.kind, "branch");
  const empty = parseScheduleRuleFlow("   ", []);
  assert.equal(empty.ok, false);
  const invalid = parseScheduleRuleFlow("NOT_A_RULE", []);
  assert.equal(invalid.ok, false);

  const action = createEmptyThenAction();
  action.behaviorName = "威胁响应";
  action.relatedObject = "驱逐舰";
  action.instanceIds = ["ins-1"];
  action.params = [{ paramId: "p1", paramName: "等级", valueType: "string", value: { kind: "input", text: "3" } }];
  const actionsText = serializeScheduleRuleFlow({ steps: [createActionsStep([action])] });
  const parsedActions = parseScheduleRuleFlow(actionsText, []);
  assert.equal(parsedActions.ok, true);

  const branch = createBranchStep();
  branch.condition.children = [
    {
      id: "leaf-var",
      type: "leaf",
      operator: "gt",
      left: {
        kind: "variable",
        objectId: "var-global-task",
        objectName: "全局任务上下文",
        objectKind: "object",
        propertyId: "key-priority",
        propertyName: "任务优先级",
        instanceIds: ["i1"],
      },
      right: { kind: "function", fn: "max", argKind: "collection", arg: { kind: "input", text: "1" } },
    },
  ];
  branch.otherwise = [createActionsStep()];
  const branchText = serializeScheduleRuleFlow({ steps: [branch] });
  const parsedBranch = parseScheduleRuleFlow(branchText, listCustomRuleVariableCatalog());
  assert.equal(parsedBranch.ok, true);

  const switchText = serializeScheduleRuleFlow({ steps: [createSwitchStep()] });
  const parsedSwitch = parseScheduleRuleFlow(switchText, []);
  assert.equal(parsedSwitch.ok, true);
  const cloned = cloneScheduleRuleFlow(original);
  assert.equal(cloned.steps.length, original.steps.length);
  assert.equal(cloneRuleFlowValue("keep"), "keep");
  assert.equal(truncateRuleFlowText("abcd", 3).endsWith("…"), true);
  assert.equal(summarizeValue({ kind: "input", text: "" }), "空值");
  assert.equal(
    summarizeValue({
      kind: "variable",
      objectId: "o",
      objectName: "对象",
      objectKind: "object",
      propertyId: "p",
      propertyName: "键",
      instanceIds: [],
    }),
    "对象.键",
  );
  assert.equal(
    summarizeValue({ kind: "variable", objectId: "", objectName: "", objectKind: "object", propertyId: "", propertyName: "", instanceIds: [] }),
    "未选变量",
  );
  assert.match(summarizeValue({ kind: "function", fn: "max", argKind: "collection", arg: { kind: "input", text: "1" } }), /求最大值/);
  assert.match(
    summarizeValue({
      kind: "expression",
      terms: [
        { id: "t1", type: "value", value: { kind: "input", text: "1" } },
        { id: "t2", type: "operator", op: "add" },
        { id: "t3", type: "group", terms: [] },
      ],
    }),
    /\+/,
  );
  const emptyComposite = createEmptyCompositeCondition(false);
  emptyComposite.logic = "or";
  assert.equal(summarizeRuleCondition(emptyComposite), "");
  assert.match(summarizeRuleCondition(createEmptyCompositeCondition(true)), /等于/);
  assert.equal(summarizeThenAction(createEmptyThenAction()), "行为无参数");
  assert.match(
    summarizeThenAction({
      id: "then-1",
      behaviorId: "",
      behaviorName: "行为",
      relatedObject: "",
      instanceIds: [],
      params: [{ paramId: "p", paramName: "等级", valueType: "string", value: { kind: "input", text: "3" } }],
    }),
    /等级/,
  );
  const elseIfBranch = createBranchStep();
  elseIfBranch.otherwise = [createBranchStep()];
  const elseIfParsed = parseScheduleRuleFlow(serializeScheduleRuleFlow({ steps: [elseIfBranch] }), []);
  assert.equal(elseIfParsed.ok, true);
  const emptyCond = createEmptyCompositeCondition(false);
  const emptyCondParsed = parseScheduleRuleFlow(serializeScheduleRuleFlow({ steps: [createBranchStep(emptyCond)] }), []);
  assert.equal(emptyCondParsed.ok, true);
  const missingThen = parseScheduleRuleFlow("IF\nFOO", []);
  assert.equal(missingThen.ok, false);
  const badJson = parseScheduleRuleFlow('IF\n  JSON {bad} == "1"\nTHEN\n  DO "x"\n', []);
  assert.equal(badJson.ok, true);
  const exprBranch = createBranchStep();
  exprBranch.condition.children = [
    {
      id: "leaf-expr",
      type: "leaf",
      operator: "eq",
      left: {
        kind: "expression",
        terms: [
          { id: "t1", type: "value", value: { kind: "input", text: "1" } },
          { id: "t2", type: "operator", op: "add" },
          { id: "t3", type: "group", terms: [{ id: "t4", type: "value", value: { kind: "input", text: "2" } }] },
        ],
      },
      right: { kind: "input", text: "3" },
    },
  ];
  const exprParsed = parseScheduleRuleFlow(serializeScheduleRuleFlow({ steps: [exprBranch] }), []);
  assert.equal(exprParsed.ok, true);
  const unknownVar = parseScheduleRuleFlow('IF\n  VAR 全局任务上下文.不存在 == "1"\nTHEN\n  DO "x"\n', listCustomRuleVariableCatalog());
  assert.equal(unknownVar.ok, true);
});

test("AI mock generate returns parseable rule text that can be aborted", async () => {
  resetCustomRuleVariableCatalog();
  const catalog = listCustomRuleVariableCatalog();
  const result = await generateScheduleRuleFromPrompt({
    prompt: "如果驱逐舰的威胁等级大于3，执行威胁响应行为",
    catalog,
  });
  assert.match(result.reply, /已生成规则/);
  const parsed = parseScheduleRuleFlow(result.dsl, catalog);
  assert.equal(parsed.ok, true);

  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    () =>
      generateScheduleRuleFromPrompt({
        prompt: "测试取消",
        catalog,
        signal: controller.signal,
      }),
    (error) => error instanceof Error && error.name === "AbortError",
  );

  await assert.rejects(() => generateScheduleRuleFromPrompt({ prompt: "   ", catalog }));
  const fallback = await generateScheduleRuleFromPrompt({ prompt: "随便描述一条规则", catalog });
  assert.equal(parseScheduleRuleFlow(fallback.dsl, catalog).ok, true);
  const noCatalog = await generateScheduleRuleFromPrompt({ prompt: "无变量目录", catalog: [] });
  assert.equal(parseScheduleRuleFlow(noCatalog.dsl, []).ok, true);
  const delayed = new AbortController();
  const pending = generateScheduleRuleFromPrompt({ prompt: "如果OSSAP相对距离小于10，执行高轨监视计划", catalog, signal: delayed.signal });
  delayed.abort();
  await assert.rejects(
    () => pending,
    (error) => error instanceof Error && error.name === "AbortError",
  );
});
