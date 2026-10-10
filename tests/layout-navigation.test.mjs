import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse, compileScript } from "@vue/compiler-sfc";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { createRenderer, h, nextTick } from "vue";
import { transpileModule, ModuleKind } from "typescript";

test("menu supports collapse and shows space management without a home entry", () => {
  const source = readFileSync(new URL("../src/layout/components/NavigationMenu.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const compiled = compileScript(descriptor, { id: "navigation" });
  assert.match(compiled.content, /update:collapsed/);
  assert.doesNotMatch(source, /index="\/workspace"/);
  assert.match(source, /index="\/workspace\/ontology-space-management"/);
  assert.match(source, /<el-menu\b/);
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

test("layout centers the native AI assistant button horizontally near the sidebar bottom", () => {
  const layout = readFileSync(new URL("../src/layout/index.vue", import.meta.url), "utf8");
  const navigation = readFileSync(new URL("../src/layout/components/NavigationMenu.vue", import.meta.url), "utf8");
  const drawer = readFileSync(new URL("../src/layout/components/AiAssistantDrawer.vue", import.meta.url), "utf8");

  assert.doesNotMatch(layout, /<AiAssistantDrawer/);
  assert.match(navigation, /<AiAssistantDrawer \/>/);
  assert.match(navigation, /\.navigation-menu \{\s*position: relative;/);
  assert.match(drawer, /<el-button\b[^>]*class="ai-assistant-launcher"/);
  assert.match(drawer, /title="AI 助手"/);
  assert.match(drawer, /:modal="false"/);
  assert.match(drawer, /modal-penetrable/);
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
  assert.match(launcherStyle, /position: absolute;/);
  assert.match(launcherStyle, /left: 50%;/);
  assert.match(launcherStyle, /bottom: 24px;/);
  assert.doesNotMatch(launcherStyle, /top:/);
  assert.match(launcherStyle, /transform: translateX\(-50%\);/);
  assert.match(launcherStyle, /width: 30px;/);
  assert.match(launcherStyle, /height: 30px;/);
  assert.match(launcherStyle, /padding: 0;/);
  assert.doesNotMatch(launcherStyle, /(?:background|border|color|box-shadow|outline):/);
  assert.doesNotMatch(drawer, /\.ai-assistant-launcher:(?:hover|focus-visible)/);
  const iconStyle = drawer.match(/\.ai-assistant-launcher svg \{[^}]*\}/)?.[0] ?? "";
  assert.match(iconStyle, /width: 25px;/);
  assert.match(iconStyle, /height: 25px;/);
});

/**
 * @description 编译实际抽屉组件并挂载到内存渲染器，以验证按钮和抽屉之间的状态协作。
 * @returns {object} 测试应用、渲染节点和抽屉状态。
 */
function createAssistantHarness() {
  const source = readFileSync(new URL("../src/layout/components/AiAssistantDrawer.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const compiled = compileScript(descriptor, { id: "assistant", inlineTemplate: true });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  runInNewContext(outputText, { exports, require: createRequire(import.meta.url) });
  /**
   * @description 创建内存渲染节点，保留属性和父子关系供 Vue 渲染器使用。
   * @param {string} type 节点类型。
   * @param {string} text 文本内容。
   * @returns {object} 内存渲染节点。
   */
  const createNode = (type, text = "") => ({ type, text, props: {}, style: {}, children: [], parent: null });
  const renderer = createRenderer({
    createElement: (type) => createNode(type),
    createText: (text) => createNode("text", text),
    createComment: (text) => createNode("comment", text),
    setText: (node, text) => (node.text = text),
    setElementText: (node, text) => (node.text = text),
    patchProp: (node, key, previous, next) => (node.props[key] = next),
    parentNode: (node) => node.parent,
    nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] ?? null,
    insert: (node, parent, anchor = null) => {
      node.parent = parent;
      const index = anchor ? parent.children.indexOf(anchor) : parent.children.length;
      parent.children.splice(index, 0, node);
    },
    remove: (node) => {
      const siblings = node.parent.children;
      siblings.splice(siblings.indexOf(node), 1);
    },
  });
  const root = createNode("root");
  const app = renderer.createApp(exports.default);
  let drawerProps;
  let closeDrawer;
  app.component("ElButton", {
    setup:
      (props, { attrs, slots }) =>
      () =>
        h("button", attrs, slots.default?.()),
  });
  app.component("ElDrawer", {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    setup: (props, { emit }) => {
      drawerProps = props;
      closeDrawer = () => emit("update:modelValue", false);
      return () => h("section");
    },
  });
  for (const name of ["ElInput", "ElDropdownItem", "ElDropdownMenu", "ElDropdown"]) {
    app.component(name, { render: () => h("span") });
  }
  app.mount(root);
  return { app, root, drawerProps, closeDrawer };
}

test("AI sidebar button stays visible and repeatedly toggles the drawer, including after drawer dismissal", async () => {
  const harness = createAssistantHarness();
  try {
    const button = harness.root.children.find((node) => node.type === "button");
    assert.ok(button);
    assert.equal(button.props["aria-label"], "打开 AI 助手");
    assert.equal(button.props["aria-expanded"], false);
    assert.equal(harness.drawerProps.modelValue, false);
    for (let index = 0; index < 4; index += 1) {
      button.props.onClick();
      await nextTick();
      const open = index % 2 === 0;
      assert.equal(harness.drawerProps.modelValue, open);
      assert.equal(button.props["aria-expanded"], open);
      assert.equal(button.props["aria-label"], open ? "关闭 AI 助手" : "打开 AI 助手");
      assert.ok(harness.root.children.includes(button));
      assert.notEqual(button.style.display, "none");
    }
    button.props.onClick();
    await nextTick();
    harness.closeDrawer();
    await nextTick();
    assert.equal(button.props["aria-expanded"], false);
    assert.equal(button.props["aria-label"], "打开 AI 助手");
    button.props.onClick();
    await nextTick();
    assert.equal(harness.drawerProps.modelValue, true);
  } finally {
    harness.app.unmount();
  }
});
