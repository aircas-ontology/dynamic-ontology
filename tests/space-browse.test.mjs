import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compile } from "@vue/compiler-dom";
import { parse } from "@vue/compiler-sfc";
import * as Vue from "vue";
import { renderToString } from "vue/server-renderer";
import { createMemoryHistory, createRouter } from "vue-router";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";

for (const domain of ["Ontology", "Theme"]) {
  test(`${domain} browsing has a separate route sharing the management page`, () => {
    const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
    const route = router.resolve({ name: `${domain}SpaceBrowse` });
    assert.equal(route.path, `/workspace/${domain.toLowerCase()}-space-browse`);
    const record = route.matched.at(-1);
    assert.deepEqual(record.props.default, { browseOnly: true });
    const management = router.resolve({ name: `${domain}SpaceManagement` }).matched.at(-1);
    assert.equal(String(record.components.default), String(management.components.default));
  });
}

/**
 * @description Render the real actions template with lightweight control stubs.
 * @param {boolean} browseOnly Whether only entry actions are allowed.
 * @returns {Promise<string>} Rendered action markup.
 */
async function renderSpaceActions(browseOnly) {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SpaceActions.vue", import.meta.url), "utf8");
  const template = parse(source).descriptor.template.content;
  const render = new Function("Vue", compile(template, { mode: "function", prefixIdentifiers: true }).code)(Vue);
  const app = Vue.createSSRApp({ setup: () => ({ browseOnly, space: {}, gradient: false, Right: {}, Edit: {}, ArrowDown: {}, command: () => {} }), render });
  for (const name of ["ArrowDown", "el-button", "el-dropdown", "el-icon", "el-dropdown-menu", "el-dropdown-item"]) {
    app.component(name, {
      setup:
        (_, { slots }) =>
        () =>
          Vue.h("div", slots.default?.()),
    });
  }
  return renderToString(app);
}

test("browse actions omit entry, and management keeps entry without app display", async () => {
  const browse = await renderSpaceActions(true);
  assert.doesNotMatch(browse, /进入|导出|编辑|更多|删除|应用展示/);
  const management = await renderSpaceActions(false);
  assert.match(management, /进入/);
  assert.match(management, /编辑/);
  assert.match(management, /更多/);
  assert.doesNotMatch(management, /应用展示/);
});

/**
 * @description Compile a real page template while stubbing external controls and requests.
 * @param {string} file Page template path.
 * @param {object} context Page state for rendering.
 * @returns {Promise<string>} Rendered page markup.
 */
async function renderPageTemplate(file, context) {
  const template = parse(readFileSync(new URL(file, import.meta.url), "utf8")).descriptor.template.content;
  const render = new Function("Vue", compile(template, { mode: "function", prefixIdentifiers: true }).code)(Vue);
  const app = Vue.createSSRApp({ render: () => render(context, []) });
  const names = new Set(Array.from(template.matchAll(/<([A-Za-z][\w-]*)/g), (match) => match[1]));
  for (const name of names) {
    if (!name.includes("-") && name[0] === name[0].toLowerCase()) continue;
    app.component(name, {
      props: ["showCreate", "browseOnly"],
      setup:
        (props, { slots }) =>
        () => {
          if (name === "el-dialog") return null;
          if (name === "WelcomePanel") return Vue.h("div", props.showCreate ? "新建空间" : "欢迎");
          return Vue.h("div", slots.default?.({ row: context.pagedSpaces?.[0] }));
        },
    });
  }
  return renderToString(app);
}

for (const viewMode of ["card", "table"]) {
  test(`theme ${viewMode} browsing opens the space from the item and keeps unavailable app display`, async () => {
    const space = { id: "one", displayName: "示例主题", apiName: "demo", metrics: {} };
    const context = {
      browseOnly: true,
      viewMode,
      stats: [],
      filteredSpaces: [space],
      pagedSpaces: [space],
      asThemeSpace: (row) => row,
    };
    const html = await renderPageTemplate("../src/views/ThemeSpaceManagement/index.vue", context);
    assert.doesNotMatch(html, /进入/);
    assert.doesNotMatch(html, /导出/);
    assert.match(html, /应用展示/);
    assert.doesNotMatch(html, /新建空间|编辑|更多|打开新手引导/);
    const management = await renderPageTemplate("../src/views/ThemeSpaceManagement/index.vue", { ...context, browseOnly: false });
    assert.match(management, /进入/);
    assert.match(management, /编辑/);
    assert.match(management, /更多/);
    assert.match(management, /新建空间/);
    assert.doesNotMatch(management, /应用展示/);
  });
}

test("browse space lists open from the card or row and hide the entry button", () => {
  const card = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SpaceCardGrid.vue", import.meta.url), "utf8");
  const table = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SpaceTableView.vue", import.meta.url), "utf8");
  const theme = readFileSync(new URL("../src/views/ThemeSpaceManagement/index.vue", import.meta.url), "utf8");
  assert.match(card, /openBrowseSpace\(space, \$event\)/);
  assert.match(card, /<SpaceActions :gradient="true"[\s\S]*v-if="!browseOnly"/);
  assert.match(table, /@row-click="openBrowseSpaceFromRow"/);
  assert.match(table, /<el-table-column v-if="!browseOnly" label="操作"/);
  assert.match(theme, /openBrowseThemeSpace\(space, \$event\)/);
  assert.match(theme, /@row-click="openBrowseThemeFromRow"/);
  assert.match(theme, /<el-button v-if="!browseOnly"[^>]*data-onboarding="theme-enter"/);
});

test("browse routes preserve embedded userName when entering a space", () => {
  const ontology = readFileSync(new URL("../src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts", import.meta.url), "utf8");
  const theme = readFileSync(new URL("../src/views/ThemeSpaceManagement/index.vue", import.meta.url), "utf8");
  assert.match(ontology, /embeddedUserName/);
  assert.match(ontology, /userName: options\.embeddedUserName\(\)/);
  assert.match(theme, /isEmbedded\.value \? \{ userName: String\(route\.query\.userName\)\.trim\(\) \}/);
  assert.match(theme, /const isEmbedded = computed\(\(\) => typeof route\.query\.userName/);
});

test("browse descriptions omit export and theme app display stays unavailable", () => {
  const theme = readFileSync(new URL("../src/views/ThemeSpaceManagement/index.vue", import.meta.url), "utf8");
  const ontology = readFileSync(new URL("../src/views/OntologySpaceManagement/index.vue", import.meta.url), "utf8");
  const welcome = readFileSync(new URL("../src/views/OntologySpaceManagement/components/WelcomePanel.vue", import.meta.url), "utf8");
  const toolbar = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SectionToolbar.vue", import.meta.url), "utf8");
  assert.match(theme, /@click="notifyUnavailable\('应用展示'\)"/);
  assert.match(theme, /<el-dialog v-model="exportDialogVisible" title="导出主题"/);
  assert.doesNotMatch(theme, /<el-dialog v-if="!browseOnly" v-model="exportDialogVisible"/);
  assert.match(ontology, /<SpaceCommandDialogs[\s\S]*v-model:export-visible="exportVisible"/);
  assert.doesNotMatch(ontology, /<SpaceCommandDialogs\s+v-if="!browseOnly"/);
  assert.match(welcome, /支持搜索、排序与进入空间/);
  assert.match(toolbar, /支持搜索、排序与进入空间/);
  assert.doesNotMatch(welcome, /支持搜索、排序、导出与进入空间/);
  assert.doesNotMatch(toolbar, /支持搜索、排序、导出与进入空间/);
});

test("object browsing opens detail from the card or row and hides the detail button", () => {
  const list = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue", import.meta.url), "utf8");
  assert.match(list, /openBrowseObjectDetail\(item, \$event\)/);
  assert.match(list, /@row-click="openBrowseObjectFromRow"/);
  assert.match(list, /<footer v-if="!browseOnly"/);
  assert.match(list, /<el-table-column v-if="!browseOnly" label="操作"/);
});

test("object browsing hides creation and guide, and passes browsing mode to the collection", async () => {
  const html = await renderPageTemplate("../src/views/OntologySpaceManagement/index.vue", {
    browseOnly: true,
    result: { items: [], total: 0, page: 1 },
    summaryStats: [],
  });
  assert.doesNotMatch(html, /新建空间|打开新手引导/);
});
