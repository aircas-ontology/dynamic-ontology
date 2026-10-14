import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { baseParse, NodeTypes, parserOptions } from "@vue/compiler-dom";
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc";
import * as Vue from "vue";
import * as VueSSR from "vue/server-renderer";
import * as ElementPlus from "element-plus";
import * as Icons from "@element-plus/icons-vue";
import ts from "typescript";
import * as endpointFilters from "../src/views/ApplicationManagement/utils/filterApiDocsEndpointGroups.ts";

const componentSource = readFileSync(new URL("../src/views/ApplicationManagement/components/ApiDocsEndpointList.vue", import.meta.url), "utf8");
const groups = [
  {
    tag: "空间接口",
    endpoints: [
      { id: "get:/space", method: "get", path: "/space", summary: "查询空间", operationId: "getSpaces", tags: ["空间接口"] },
      { id: "post:/space", method: "post", path: "/space", summary: "创建空间", operationId: "createSpace", tags: ["空间接口"] },
    ],
  },
];
const requiredAriaNames = new Set(["aria-label", "aria-hidden", "aria-expanded", "aria-controls", "aria-current"]);

/**
 * @description 收集模板或渲染 HTML 中的元素节点，不依赖源码换行格式。
 * @param {string} markup 模板或 HTML 内容。
 * @returns {Array<object>} 元素节点。
 */
function getElements(markup) {
  const elements = [];
  /**
   * @description 遍历解析树并收集原生或组件元素。
   * @param {object} node 模板解析节点。
   */
  function visitNode(node) {
    if (node.type === NodeTypes.ELEMENT) elements.push(node);
    node.children?.forEach(visitNode);
  }
  visitNode(baseParse(markup, parserOptions));
  return elements;
}

/**
 * @description 提取静态属性、绑定属性以及内联 v-bind 对象中的 ARIA 名称。
 * @param {string} template Vue 模板内容，不扫描脚本 Prop 标识符。
 * @returns {string[]} ARIA 属性名称。
 */
function getAriaNames(template) {
  const names = [];
  for (const element of getElements(template)) {
    for (const prop of element.props) {
      if (prop.type === NodeTypes.ATTRIBUTE) {
        if (/^aria(?:-|[A-Z])/.test(prop.name)) names.push(prop.name);
      } else if (prop.name === "bind" && prop.arg?.isStatic) {
        if (/^aria(?:-|[A-Z])/.test(prop.arg.content)) names.push(prop.arg.content);
      } else if (prop.name === "bind" && !prop.arg && prop.exp) {
        const expression = ts.createSourceFile("ariaBindings.ts", `const attributes = ${prop.exp.content};`, ts.ScriptTarget.Latest, true);
        /**
         * @description 收集内联属性对象的 ARIA 键名。
         * @param {object} node TypeScript 语法节点。
         */
        function visitProperty(node) {
          if (ts.isPropertyAssignment(node) && (ts.isStringLiteral(node.name) || ts.isIdentifier(node.name))) {
            const name = node.name.text;
            if (/^aria(?:-|[A-Z])/.test(name)) names.push(name);
          }
          ts.forEachChild(node, visitProperty);
        }
        visitProperty(expression);
      }
    }
  }
  return names;
}

/**
 * @description 编译并执行真实组件模块，只提供真实的已安装依赖。
 * @param {string} source 编译器生成的模块源码。
 * @returns {object} 模块导出。
 */
function evaluateCompiledModule(source) {
  const exports = {};
  const dependencies = {
    vue: Vue,
    "vue/server-renderer": VueSSR,
    "@element-plus/icons-vue": Icons,
    "../utils/filterApiDocsEndpointGroups": endpointFilters,
  };
  /**
   * @description 解析编译结果中的依赖，未声明的依赖直接失败。
   * @param {string} name 模块名称。
   * @returns {object} 真实依赖模块。
   */
  function requireDependency(name) {
    assert.ok(Object.hasOwn(dependencies, name), `unexpected component dependency: ${name}`);
    return dependencies[name];
  }
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "exports", compiled)(requireDependency, exports);
  return exports;
}

/**
 * @description 创建 SSR 会话，保留真实 setup 状态以执行组件自身的状态处理函数。
 * @param {string} selectedId 当前选中的接口。
 * @returns {{ render: () => Promise<string>, getTree: () => object, selections: string[] }} 渲染、真实事件绑定及选中事件。
 */
function createRenderSession(selectedId = "get:/space") {
  const { descriptor, errors } = parse(componentSource);
  assert.deepEqual(errors, []);
  const script = compileScript(descriptor, { id: "application-aria" });
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: "ApiDocsEndpointList.vue",
    id: "application-aria",
    compilerOptions: { bindingMetadata: script.bindings },
  });
  assert.deepEqual(template.errors, []);
  const component = evaluateCompiledModule(script.content).default;
  const renderTemplate = evaluateCompiledModule(template.code).render;
  let state;
  let tree;
  const selections = [];
  const testedComponent = {
    ...component,
    /**
     * @description 执行真实模板，保留事件绑定供状态测试调用。
     * @param {...unknown} args Vue 渲染上下文参数。
     * @returns {object} 模板生成的 VNode。
     */
    render(...args) {
      tree = renderTemplate(...args);
      return tree;
    },
    /**
     * @description 首次执行真实 setup，后续渲染复用其业务状态。
     * @param {object} props 当前组件参数。
     * @param {object} context Vue setup 上下文。
     * @returns {object} 真实组件状态。
     */
    setup(props, context) {
      state ??= component.setup(props, context);
      return state;
    },
  };
  /**
   * @description 通过真实 Element Plus 渲染组件的当前状态。
   * @returns {Promise<string>} 服务端渲染 HTML。
   */
  async function render() {
    const app = Vue.createSSRApp(testedComponent, { groups, selectedId, onSelect: (id) => selections.push(id) });
    app.component("el-input", ElementPlus.ElInput);
    app.component("el-select", ElementPlus.ElSelect);
    app.component("el-option", ElementPlus.ElOption);
    app.component("el-icon", ElementPlus.ElIcon);
    app.provide(ElementPlus.ID_INJECTION_KEY, { prefix: 123, current: 0 });
    app.provide(ElementPlus.ZINDEX_INJECTION_KEY, { current: 0 });
    return VueSSR.renderToString(app);
  }
  return { render, getTree: () => tree, selections };
}

/**
 * @description 读取渲染元素的静态 HTML 属性。
 * @param {object} element 已解析的 HTML 元素。
 * @param {string} name 属性名称。
 * @returns {string | undefined} 属性值，缺失时返回 undefined。
 */
function getAttribute(element, name) {
  return element.props.find((prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === name)?.value?.content;
}

/**
 * @description 按 CSS 类名定位渲染元素。
 * @param {string} html 实际渲染 HTML。
 * @param {string} className 类名。
 * @returns {object} 匹配的唯一元素。
 */
function findElementByClass(html, className) {
  const matches = getElements(html).filter((element) => getAttribute(element, "class")?.split(/\s+/).includes(className));
  assert.equal(matches.length, 1, `expected one ${className}`);
  return matches[0];
}

/**
 * @description 从真实模板 VNode 中获取绑定了事件的指定元素。
 * @param {object} tree 模板生成的 VNode 树。
 * @param {string} className 元素类名。
 * @returns {Array<object>} 匹配的 VNode。
 */
function findRenderedNodes(tree, className) {
  const found = [];
  /**
   * @description 遍历原生元素和 Fragment 子节点。
   * @param {object} node VNode。
   */
  function visitNode(node) {
    if (node?.props?.class?.split(/\s+/).includes(className)) found.push(node);
    if (Array.isArray(node?.children)) node.children.forEach(visitNode);
  }
  visitNode(tree);
  return found;
}

test("endpoint list template keeps standard ARIA names for attributes and bindings", () => {
  const { descriptor } = parse(componentSource);
  const names = getAriaNames(descriptor.template.content);
  assert.deepEqual(
    names.filter((name) => !/^aria-[a-z]+(?:-[a-z]+)*$/.test(name)),
    [],
    "ARIA attributes must use standard kebab-case",
  );
  for (const name of requiredAriaNames) assert.ok(names.includes(name), `missing required ${name}`);
});

test("endpoint search and menu labels use direct aria-label attributes", () => {
  const { descriptor } = parse(componentSource);
  const elements = getElements(descriptor.template.content);
  for (const [tag, label] of [
    ["el-input", "按接口地址搜索"],
    ["el-select", "按接口菜单筛选"],
  ]) {
    const control = elements.find((element) => element.tag === tag);
    assert.ok(control, `missing ${tag}`);
    assert.equal(getAttribute(control, "aria-label"), label, `${tag} must use a direct aria-label attribute`);
  }
});

test("ARIA spelling check catches camelCase, bound camelCase and inline object regressions", () => {
  for (const template of ['<el-input ariaLabel="搜索" />', '<el-input :ariaLabel="label" />', '<el-input v-bind="{ ariaLabel: label }" />']) {
    assert.deepEqual(getAriaNames(template), ["ariaLabel"]);
    assert.equal(
      getAriaNames(template).every((name) => requiredAriaNames.has(name)),
      false,
    );
  }
  assert.deepEqual(getAriaNames("<el-input v-bind=\"{ 'aria-label': label }\" />"), ["aria-label"]);
  const { descriptor } = parse('<template><el-input aria-label="搜索" /></template><script setup>const ariaLabel = "搜索";</script>');
  assert.deepEqual(getAriaNames(descriptor.template.content), ["aria-label"]);
});

test("real Element Plus inputs receive native aria-label without leaked camelCase attributes", async () => {
  const session = createRenderSession();
  const elements = getElements(await session.render());
  for (const label of ["按接口地址搜索", "按接口菜单筛选"]) {
    const inputs = elements.filter((element) => element.tag === "input" && getAttribute(element, "aria-label") === label);
    assert.equal(inputs.length, 1, `${label} must label exactly one native input`);
  }
  assert.ok(elements.every((element) => element.props.every((prop) => prop.type !== NodeTypes.ATTRIBUTE || !/^aria[A-Z]/.test(prop.name))));
});

test("expanded controls refer to the rendered group and decorative icons are hidden", async () => {
  const session = createRenderSession();
  const html = await session.render();
  const button = findElementByClass(html, "api-docs-endpoint-list__group-toggle");
  const body = findElementByClass(html, "api-docs-endpoint-list__group-body");
  assert.equal(getAttribute(button, "aria-expanded"), "true");
  assert.equal(getAttribute(button, "aria-controls"), getAttribute(body, "id"));
  assert.ok(getAttribute(body, "id"));
  const hidden = button.children.find((element) => element.type === NodeTypes.ELEMENT && getAttribute(element, "aria-hidden") === "true");
  assert.ok(hidden, "decorative icon must have an aria-hidden ancestor");
  assert.ok(hidden.children.some((element) => element.type === NodeTypes.ELEMENT && element.tag === "i"));
});

test("real group toggle changes aria-expanded together with visible group content", async () => {
  const session = createRenderSession();
  await session.render();
  findRenderedNodes(session.getTree(), "api-docs-endpoint-list__group-toggle")[0].props.onClick();
  const collapsed = await session.render();
  assert.equal(getAttribute(findElementByClass(collapsed, "api-docs-endpoint-list__group-toggle"), "aria-expanded"), "false");
  assert.match(getAttribute(findElementByClass(collapsed, "api-docs-endpoint-list__group-body"), "style"), /display:\s*none/);
  findRenderedNodes(session.getTree(), "api-docs-endpoint-list__group-toggle")[0].props.onClick();
  const expanded = await session.render();
  assert.equal(getAttribute(findElementByClass(expanded, "api-docs-endpoint-list__group-toggle"), "aria-expanded"), "true");
  assert.doesNotMatch(getAttribute(findElementByClass(expanded, "api-docs-endpoint-list__group-body"), "style") ?? "", /display:\s*none/);
});

test("only the selected endpoint receives aria-current and changing selection changes its owner", async () => {
  for (const selectedId of ["get:/space", "post:/space", ""]) {
    const html = await createRenderSession(selectedId).render();
    const items = getElements(html).filter((element) => getAttribute(element, "class")?.split(/\s+/).includes("api-docs-endpoint-list__item"));
    assert.equal(items.length, 2);
    const selected = items.filter((element) => getAttribute(element, "aria-current") === "true");
    assert.equal(selected.length, selectedId ? 1 : 0);
    if (selectedId) assert.ok(getAttribute(selected[0], "class").split(/\s+/).includes("is-active"));
    assert.equal(getAttribute(items[selectedId.startsWith("post") ? 1 : 0], "aria-current"), selectedId ? "true" : undefined);
    assert.ok(items.filter((element) => element !== selected[0]).every((element) => getAttribute(element, "aria-current") === undefined));
  }
});

test("endpoint selection invokes the real template event with the endpoint id", async () => {
  const session = createRenderSession();
  await session.render();
  const items = findRenderedNodes(session.getTree(), "api-docs-endpoint-list__item");
  assert.equal(items.length, 2);
  items[1].props.onClick();
  assert.deepEqual(session.selections, ["post:/space"]);
});
