import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse, compileScript } from "@vue/compiler-sfc";

test("menu supports collapse and shows space management without a home entry", () => {
  const source = readFileSync(new URL("../src/layout/components/NavigationMenu.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const compiled = compileScript(descriptor, { id: "navigation" });
  assert.match(compiled.content, /update:collapsed/);
  assert.doesNotMatch(source, /index="\/workspace"/);
  assert.match(source, /index="\/workspace\/ontology-space-management"/);
  assert.match(source, /aircas-menu/);
});

test("menu includes full text search entry with named route", () => {
  const source = readFileSync(new URL("../src/layout/components/NavigationMenu.vue", import.meta.url), "utf8");
  assert.match(source, /全文检索/);
  assert.match(source, /name:\s*['"]FullTextSearch['"]/);
});

test("breadcrumb shows a location pin and current page without a home crumb", () => {
  const source = readFileSync(new URL("../src/layout/components/BreadcrumbBar.vue", import.meta.url), "utf8");
  assert.match(source, /<Location/);
  assert.match(source, /breadcrumb-bar__pin/);
  assert.doesNotMatch(source, />首页</);
  assert.doesNotMatch(source, /公共消息/);
});

test("breadcrumb adds 创建子空间 after the current space name", () => {
  const source = readFileSync(new URL("../src/layout/components/BreadcrumbBar.vue", import.meta.url), "utf8");
  assert.match(source, /OntologySubspaceCreate/);
  assert.match(source, /创建子空间/);
  assert.match(source, /isSubspaceCreate[\s\S]*OntologySpaceManagementDetail[\s\S]*创建子空间/);
});

test("layout opens an AI assistant drawer from a bottom-right launcher", () => {
  const layout = readFileSync(new URL("../src/layout/index.vue", import.meta.url), "utf8");
  const drawer = readFileSync(new URL("../src/layout/components/AiAssistantDrawer.vue", import.meta.url), "utf8");

  assert.match(layout, /<AiAssistantDrawer \/>/);
  assert.match(drawer, /aria-label="打开 AI 助手"/);
  assert.match(drawer, /title="AI 助手"/);
  assert.match(drawer, /:modal="false"/);
  assert.match(drawer, /智能管理助手/);
  assert.match(drawer, /提供对象、属性、关系、行为、函数算子和行为调度的构建管理问答/);
  assert.match(drawer, /新建福特级航空母舰/);
  assert.match(drawer, /创建一个名称属性/);
  assert.match(drawer, /创建舰艇编制关系/);
  assert.match(drawer, /创建一个巡航行为/);
  assert.match(drawer, /编辑函数算子运行配置/);
  assert.match(drawer, /导出行为调度和规则库/);
  assert.match(drawer, /请输入问题，Ctrl \+ Enter 发送/);
  assert.match(drawer, /maxlength="1000"/);
  assert.match(drawer, /function applyAssistantPrompt/);
  assert.match(drawer, /function submitAssistantQuestion/);
  assert.match(drawer, /keydown\.ctrl\.enter/);
  assert.match(drawer, /size="620px"/);
  assert.match(drawer, /class="ai-assistant-drawer__stage"/);
  assert.match(drawer, /v-if="messages.length"[\s\S]*class="ai-assistant-drawer__conversation"/);
  assert.match(drawer, /ai-assistant-drawer__message--user/);
  assert.match(drawer, /ai-assistant-drawer__message--assistant/);
  assert.match(drawer, /role: "user"/);
  assert.match(drawer, /role: "assistant"/);
  assert.match(drawer, /function resolveAssistantReply/);
  assert.match(drawer, /在「舰船 \/ 航空母舰」下新建「福特级航空母舰\(CVN\)」/);
  assert.match(drawer, /同一对象只能有一个名称键/);
  assert.match(drawer, /源对象与目标对象分别选择编制双方/);
  assert.match(drawer, /新建「巡航」行为/);
  assert.match(drawer, /调整运行配置后保存/);
  assert.match(drawer, /导出当前行为调度及其规则库/);
  assert.match(drawer, /v-else[\s\S]*class="ai-assistant-drawer__prompts"/);
  assert.match(drawer, /class="ai-assistant-drawer__composer"/);
  const launcherStyle = drawer.match(/\.ai-assistant-launcher \{[^}]*\}/)?.[0] ?? "";
  assert.match(launcherStyle, /border: 1px solid var\(--aircas-color-border\)/);
  assert.match(launcherStyle, /color: var\(--aircas-color-text-primary\)/);
  assert.match(launcherStyle, /background: color-mix\(in srgb, var\(--aircas-color-accent-cyan\) 60%, transparent\)/);
  assert.doesNotMatch(launcherStyle, /opacity:/);
  assert.match(launcherStyle, /box-shadow: 0 8px 20px var\(--aircas-color-divider\)/);
});
