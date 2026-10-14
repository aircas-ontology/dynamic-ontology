import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

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
  "../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowDesigner.vue",
  "../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowPalette.vue",
  "../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowToolbar.vue",
  "../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleFormDialog.vue",
  "../src/views/SpaceBehaviorScheduleWorkspace/CustomRuleVariableDialog.vue",
  "../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/CustomRuleVariableEditors.vue",
  "../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowCodeEditor.vue",
  "../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleAiChatPanel.vue",
];

test("rule config dialog opens a fullscreen canvas with save and without deferred header actions", () => {
  const formSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleFormDialog.vue");
  const dialogSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleRuleConfigDialog.vue");
  const designerSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowDesigner.vue");
  const paletteSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowPalette.vue");
  const toolbarSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowToolbar.vue");

  assert.doesNotMatch(formSource, /规则配置页面暂未接入/);
  assert.match(formSource, /BehaviorScheduleRuleConfigDialog/);
  assert.match(formSource, /from "\.\/BehaviorScheduleRuleConfigDialog\.vue"/);
  assert.match(formSource, /native-type="button"/);
  assert.match(formSource, /规则配置（已应用）/);
  assert.match(formSource, /openRuleConfigDialog/);
  assert.match(dialogSource, /class="aircas-dialog/);
  assert.match(dialogSource, /fullscreen/);
  assert.match(dialogSource, /:z-index="5000"/);
  assert.match(dialogSource, /close-on-click-modal/);
  assert.match(dialogSource, />返回</);
  assert.match(dialogSource, />取消</);
  assert.match(dialogSource, />保存</);
  assert.match(dialogSource, /自定义变量/);
  assert.match(dialogSource, /规则代码/);
  assert.match(dialogSource, /AI 生成规则/);
  assert.match(paletteSource, /条件分支/);
  assert.match(paletteSource, /执行行为/);
  assert.match(paletteSource, /Switch 分支/);
  assert.match(paletteSource, /application\/x-rule-node/);
  assert.match(toolbarSource, /清空画布/);
  assert.match(toolbarSource, /自动布局/);
  assert.match(toolbarSource, /适应画布/);
  assert.match(toolbarSource, /删除选中/);
  assert.match(designerSource, /ScheduleRuleFlowGraphSession/);
});

test("rule canvas uses X6 resetCells, dispose, and Dagre layout", () => {
  const sessionSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowGraphSession.ts");
  const factorySource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory.ts");
  const typeSource = readSource("../src/types/pages/ontologySpaceBehaviorScheduleType.ts");
  const typesIndex = readSource("../src/types/index.ts");
  const workspaceSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/index.vue");
  const packageSource = readSource("../package.json");

  assert.match(sessionSource, /from "@antv\/x6"/);
  assert.match(sessionSource, /new Graph/);
  assert.match(sessionSource, /resetCells/);
  assert.match(sessionSource, /\.dispose\(\)/);
  assert.match(sessionSource, /DagreLayout/);
  assert.match(sessionSource, /import\("@antv\/layout"\)/);
  assert.match(factorySource, /createDefaultScheduleRuleFlow/);
  assert.match(factorySource, /createBranchStep/);
  assert.match(typeSource, /ScheduleRuleFlowDocument/);
  assert.match(typeSource, /ruleFlow/);
  assert.match(typesIndex, /ScheduleRuleFlowDocument/);
  assert.match(workspaceSource, /ruleFlow/);
  assert.match(packageSource, /"@antv\/layout"/);
});

test("each rule-config Vue file stays at or under 500 lines", () => {
  for (const relativePath of vueFiles) {
    const source = readSource(relativePath);
    const lineCount = countSourceLines(source);
    assert.ok(lineCount <= 500, `${relativePath} has ${lineCount} lines`);
  }
});
