import * as relationCategories from "../src/views/EntityBrowsingObjectProfile/utils/entityRelationCategories.ts";
import * as detailCategories from "../src/views/EntityBrowsingObjectProfile/utils/entityDetailCategories.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { ModuleKind, transpileModule } from "typescript";
import { renderToString } from "@vue/server-renderer";
import { readObjectProfileEntityPrimaryKey } from "../src/views/EntityBrowsingObjectProfile/utils/mapObjectProfileEntityRows.ts";
import { createObjectProfileEntityRelationsMock } from "../src/mocks/objectProfileEntityDetailMock/objectProfileEntityDetailMock.ts";
import { buildEntityPropertyRows, buildEntityPropertyTable, groupEntityPropertyRows } from "../src/views/EntityBrowsingObjectProfile/utils/entityDetailData.ts";

/** @description 编译真实组件并只替换依赖边界。 @param {string} name 组件名称。 @param {Function} resolve 模块解析器。 @param {boolean} inlineTemplate 是否编译模板。 @returns {object} Vue 组件。 */
function compileProfileComponent(name, resolve, inlineTemplate = false, initialTab = "properties") {
  const { descriptor } = parse(
    readFileSync(
      new URL(
        name === "OntologyRelationGraph3d"
          ? "../src/components/OntologyRelationGraph3d.vue"
          : `../src/views/EntityBrowsingObjectProfile/components/${name}.vue`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  if (name === "ObjectProfileEntityDetail")
    descriptor.scriptSetup.content = descriptor.scriptSetup.content.replace('ref("properties")', `ref("${initialTab}")`);
  const { outputText } = transpileModule(compileScript(descriptor, { id: name, inlineTemplate }).content.replace('ref("properties")', `ref("${initialTab}")`), {
    compilerOptions: { module: ModuleKind.CommonJS },
  });
  const exports = {};
  new Function("require", "exports", outputText)((id) => {
    if (id.includes("entityDetailCategories")) return detailCategories;
    if (id.includes("entityRelationCategories")) return relationCategories;
    if (id.includes("useEntityRelationCategories"))
      return { useEntityRelationCategories: () => ({ items: Vue.ref(undefined), status: Vue.ref("empty"), error: Vue.ref(""), fetchRelationCategories() {} }) };
    if (id.includes("useEntityBehaviorCategories"))
      return { useEntityBehaviorCategories: () => ({ items: Vue.ref([]), status: Vue.ref("empty"), error: Vue.ref(""), fetchBehaviorCategories() {} }) };
    return resolve(id);
  }, exports);
  return exports.default;
}

test("native entity detail opens selected identity and returning preserves list page and filters", async () => {
  const rows = Vue.ref([
    { rowKey: "row", ontologyUniqueIdentifier: "object-a", instanceId: "0", entityPrimaryKey: 0, cells: { 名称: "实体甲" }, detailItems: [] },
  ]);
  const pageNum = Vue.ref(3),
    filterValue = Vue.ref("甲"),
    events = [];
  const scope = Vue.effectScope();
  const component = compileProfileComponent("ObjectProfileEntityList", (id) => {
    if (id === "vue") return Vue;
    if (id === "@/apis") return { getOntologyInstanceUrlListInterface: async () => ({ code: 200, data: [] }) };
    if (id.includes("useObjectProfileEntityList"))
      return { useObjectProfileEntityList: () => ({ filteredRows: rows, pageNum, filterValue, status: Vue.ref("ready") }) };
    if (id.includes("mapObjectProfileEntityRows")) return { readObjectProfileEntityPrimaryKey };
    if (id === "element-plus") return { ElMessage: { error: (message) => events.push(message) } };
    return {};
  });
  const props = Vue.reactive({ objectId: "object-a", spaceId: "156", autoOpenDetail: false });
  try {
    const page = scope.run(() => component.setup(props, { expose() {}, emit: (...args) => events.push(args) }));
    assert.equal(page.openEntityDetail(rows.value[0]), true);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(page.detailStatus.value, "native");
    assert.equal(page.selectedEntity.value.instanceId, "0");
    assert.equal(page.selectedEntity.value.entityPrimaryKey, 0);
    assert.equal(page.resolveEntityTitle(page.selectedEntity.value), "实体甲");
    page.closeEntityDetail();
    assert.equal(page.selectedEntity.value, null);
    assert.equal(pageNum.value, 3);
    assert.equal(filterValue.value, "甲");
    assert.equal(page.openEntityDetail({ ...rows.value[0], instanceId: "" }), false);
    assert.match(events.at(-1), /主键/);
  } finally {
    scope.stop();
  }
});

test("entity detail renders tab panels with readonly relations and object behavior boundary", async () => {
  const boundaries = [];
  const empty = Vue.defineComponent({ render: () => null });
  const slot = Vue.defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        Vue.h("div", slots.default?.()),
  });
  const graph = Vue.defineComponent({
    props: { items: Array, seedNames: Array, readonly: Boolean, emptyDescription: String },
    setup: (props) => {
      boundaries.push(props);
      return () => Vue.h("div", props.emptyDescription);
    },
  });
  const behavior = Vue.defineComponent({
    props: ["items"],
    setup: (props) => {
      boundaries.push(props);
      return () => Vue.h("div", "对象行为");
    },
  });
  const state = {
    relations: Vue.ref([{ id: "api-relation", sourceName: "接口实体" }]),
    relationStatus: Vue.ref("ready"),
    relationError: Vue.ref(""),
    loadEntityRelations() {},
    displayProperties: Vue.ref([]),
    usingListProperties: Vue.ref(false),
    categories: Vue.ref([]),
    behaviors: Vue.ref([{ id: 1 }]),
    selectedCategoryId: Vue.ref("all"),
    selectedBehaviorCategoryId: Vue.ref("all"),
    filteredProperties: Vue.ref([]),
    propertyStatus: Vue.ref("empty"),
    categoryStatus: Vue.ref("empty"),
    behaviorStatus: Vue.ref("ready"),
    propertyError: Vue.ref(""),
    categoryError: Vue.ref(""),
    behaviorError: Vue.ref(""),
    behaviorPage: Vue.ref(1),
    behaviorPageSize: 8,
    behaviorTotal: Vue.ref(1),
    loadEntityProperties() {},
    loadPropertyCategories() {},
    loadEntityBehaviors() {},
  };
  const component = compileProfileComponent(
    "ObjectProfileEntityDetail",
    (id) => {
      if (id === "vue") return Vue;
      if (id.includes("AircasLoading")) return { __esModule: true, default: slot };
      if (id.includes("entityDetailData")) return { buildEntityPropertyTable, groupEntityPropertyRows };
      if (id.includes("objectProfileEntityDetailMock")) return { createObjectProfileEntityRelationsMock };
      if (id.includes("useObjectProfileEntityDetail")) return { useObjectProfileEntityDetail: () => state };
      if (id.includes("OntologyRelationGraph2d")) return { __esModule: true, default: graph };
      if (id.includes("ObjectProfileEntityBehaviors")) return { __esModule: true, default: behavior };
      return { __esModule: true, default: empty };
    },
    true,
    "relations",
  );
  const app = Vue.createSSRApp(component, {
    objectId: "object-a",
    instanceId: "0",
    spaceId: "156",
    entityName: "实体甲",
    relations: [{ id: "r", sourceName: "实体甲", targetName: "实体乙" }],
  });
  for (const name of ["el-button", "el-input", "el-empty", "el-tree", "el-table", "el-table-column", "el-tag", "el-alert"]) app.component(name, slot);
  const html = await renderToString(app);
  assert.match(html, /属性分类树/);
  assert.match(html, /实体属性和值/);
  assert.match(html, /实体关系/);
  assert.match(html, /对象行为/);
  assert.doesNotMatch(html, /返回实体列表/);
  assert.equal(boundaries[0].readonly, true);
  assert.deepEqual(boundaries[0].seedNames, ["实体甲"]);
  assert.deepEqual(boundaries[1].items, [{ id: 1 }]);

  for (const status of ["loading", "error", "empty", "ready"]) {
    state.relationStatus.value = status;
    state.relationError.value = status === "error" ? "实体关系查询失败" : "";
    state.relations.value = status === "ready" ? [{ id: "api-row", sourceName: "真实实体", targetName: "实体乙" }] : [];
    const relationApp = Vue.createSSRApp(component, { objectId: "object-a", instanceId: "0", spaceId: "156", entityName: "实体甲" });
    for (const name of ["el-button", "el-input", "el-empty", "el-tree", "el-table", "el-table-column", "el-tag", "el-alert"]) relationApp.component(name, slot);
    const relationHtml = await renderToString(relationApp);
    assert.doesNotMatch(relationHtml, /示例数据/);
    if (status === "loading") assert.match(relationHtml, /正在加载实体关系/);
    else if (status === "error") {
      assert.match(relationHtml, /实体关系查询失败/);
      assert.match(relationHtml, /重试/);
    } else if (status === "ready") assert.deepEqual(boundaries.at(-2).items, relationCategories.enrichEntityRelationCategories(state.relations.value));
    else assert.match(relationHtml, /当前分类暂无关联实体/);
  }
  state.propertyStatus.value = "ready";
  state.filteredProperties.value = buildEntityPropertyRows({
    propertyGroups: [
      { storageGroup: "main", groupDataList: [{ dataPrimaryKey: 5, props: [{ propertyDisplayName: "是否隐身", propertyValue: false }] }] },
      {
        storageGroup: "weapon",
        groupDataList: [
          { dataPrimaryKey: 11, props: [{ propertyDisplayName: "武器名称", propertyValue: "SCAL" }] },
          { dataPrimaryKey: 12, props: [{ propertyDisplayName: "挂载数量", propertyValue: 0 }] },
        ],
      },
    ],
  });
  const populatedApp = Vue.createSSRApp(component, { objectId: "object-a", instanceId: "0", spaceId: "156", entityName: "实体甲", relations: [] });
  for (const name of ["el-button", "el-input", "el-empty", "el-tree", "el-tag", "el-alert"]) populatedApp.component(name, slot);
  populatedApp.component(
    "el-table",
    Vue.defineComponent({
      props: ["data"],
      setup: (props, { slots }) => {
        Vue.provide("tableRows", props.data);
        return () => Vue.h("table", slots.default?.());
      },
    }),
  );
  populatedApp.component(
    "el-table-column",
    Vue.defineComponent({
      props: ["prop", "label"],
      setup: (props, { slots }) => {
        const rows = Vue.inject("tableRows");
        return () => Vue.h("tbody", [Vue.h("th", props.label), ...rows.map((row) => Vue.h("td", slots.default ? slots.default({ row }) : row[props.prop]))]);
      },
    }),
  );
  const populated = await renderToString(populatedApp);
  assert.match(populated, /<dl[\s>]/);
  assert.match(populated, /<dt[^>]*>是否隐身<\/dt>/);
  assert.match(populated, /<dd[^>]*>false<\/dd>/);
  assert.match(populated, /<span[^>]*>0<\/span>/);
  assert.match(populated, /weapon/);
  assert.match(populated, /<td>11<\/td>/);
  assert.match(populated, /<td>12<\/td>/);
  assert.match(populated, /<th>武器名称<\/th>/);
  assert.match(populated, /<span[^>]*>—<\/span>/);
  assert.equal((populated.match(/<table/g) ?? []).length, 1);
  assert.equal((populated.match(/<dl[\s>]/g) ?? []).length, 1);
});

test("detail preserves primary-key identity and uses API relations unless explicit data is supplied", () => {
  const scope = Vue.effectScope();
  let currentIdentity;
  const component = compileProfileComponent("ObjectProfileEntityDetail", (id) => {
    if (id === "vue") return Vue;
    if (id.includes("entityDetailData")) return { buildEntityPropertyTable, groupEntityPropertyRows };
    if (id.includes("objectProfileEntityDetailMock")) return { createObjectProfileEntityRelationsMock };
    if (id.includes("useObjectProfileEntityDetail"))
      return {
        useObjectProfileEntityDetail: (identity) => {
          currentIdentity = identity;
          return { relations: Vue.ref([{ id: "api-relation", sourceName: "接口实体" }]), displayProperties: Vue.ref([]), categories: Vue.ref([]) };
        },
      };
    return {};
  });
  const props = Vue.reactive({
    objectId: "aircraft",
    instanceId: "5",
    entityPrimaryKey: 5,
    spaceId: "156",
    entityName: "阵风F4",
    listProperties: [{ label: "名称", value: "阵风F4" }],
    relations: undefined,
  });
  try {
    const page = scope.run(() => component.setup(props, { expose() {}, emit() {} }));
    assert.equal(currentIdentity.value.entityPrimaryKey, 5);
    assert.deepEqual(currentIdentity.value.listProperties, props.listProperties);
    assert.deepEqual(page.rawRelations.value, [{ id: "api-relation", sourceName: "接口实体" }]);
    props.entityName = "实体乙";
    assert.equal(page.rawRelations.value[0].sourceName, "接口实体");
    props.relations = [];
    assert.deepEqual(page.rawRelations.value, []);
    props.relations = [{ id: "real-relation" }];
    assert.deepEqual(page.rawRelations.value, [{ id: "real-relation" }]);
  } finally {
    scope.stop();
  }
});

test("detail retains independent tab selections and resets them for a different instance", async () => {
  const component = compileProfileComponent("ObjectProfileEntityDetail", (id) => {
    if (id === "vue") return Vue;
    if (id.includes("useObjectProfileEntityDetail")) return { useObjectProfileEntityDetail: () => ({ relations: Vue.ref([]), categories: Vue.ref([]) }) };
    return {};
  });
  const scope = Vue.effectScope();
  const props = Vue.reactive({ objectId: "a", instanceId: "0", spaceId: "156", entityName: "甲" });
  try {
    const page = scope.run(() => component.setup(props, { expose() {} }));
    assert.equal(page.activeTab.value, "properties");
    page.categorySearch.value = "性能";
    page.activeTab.value = "relations";
    page.relationView.value = "graph3d";
    page.relationCategoryId.value = "2";
    page.activeTab.value = "behaviors";
    page.activeTab.value = "relations";
    assert.equal(page.relationView.value, "graph3d");
    assert.equal(page.relationCategoryId.value, "2");
    assert.equal(page.categorySearch.value, "性能");
    props.instanceId = "1";
    await Vue.nextTick();
    assert.equal(page.activeTab.value, "properties");
    assert.equal(page.relationView.value, "graph2d");
    assert.equal(page.relationCategoryId.value, "all");
    assert.equal(page.categorySearch.value, "");
  } finally {
    scope.stop();
  }
});

test("header tabs select details without badges and support keyboard focus without resetting relation state", async () => {
  const component = compileProfileComponent("ObjectProfileEntityDetail", (id) => {
    if (id === "vue") return Vue;
    if (id.includes("useObjectProfileEntityDetail")) return { useObjectProfileEntityDetail: () => ({ relations: Vue.ref([]), categories: Vue.ref([]) }) };
    return {};
  });
  const scope = Vue.effectScope();
  try {
    const page = scope.run(() => component.setup({ objectId: "a", instanceId: "0", spaceId: "156", entityName: "甲" }, { expose() {} }));
    const focused = [];
    page.tabListRef.value = { querySelector: (selector) => ({ focus: () => focused.push(selector) }) };
    page.relationView.value = "graph3d";
    let prevented = 0;
    for (const [key, expected] of [
      ["ArrowRight", "relations"],
      ["End", "behaviors"],
      ["ArrowRight", "properties"],
      ["ArrowLeft", "behaviors"],
      ["Home", "properties"],
    ]) {
      await page.handleDetailTabKeydown({ key, preventDefault: () => prevented++ });
      assert.equal(page.activeTab.value, expected);
      assert.equal(focused.at(-1), `[data-detail-tab="${expected}"]`);
    }
    await page.handleDetailTabKeydown({ key: "Tab", preventDefault: () => prevented++ });
    assert.equal(prevented, 5);
    page.selectDetailTab("invalid");
    assert.equal(page.activeTab.value, "properties");
    page.selectDetailTab("relations");
    assert.equal(page.relationView.value, "graph3d");
    assert.deepEqual(
      page.detailTabs.map((tab) => tab.label),
      ["属性", "关系", "行为"],
    );
    assert.ok(page.detailTabs.every((tab) => !("count" in tab)));
  } finally {
    scope.stop();
  }
});

test("detail teleports its three text-only tabs into the supplied header and removes them on unmount", async () => {
  /** @description 创建可供 Vue 渲染与 v-show 操作的测试宿主节点。 @param {string} type 节点类型。 @returns {object} 宿主节点。 */
  function createTabHostNode(type) {
    return { type, children: [], parent: null, props: {}, style: {}, text: "" };
  }
  const renderer = Vue.createRenderer({
    createElement: createTabHostNode,
    createText: () => createTabHostNode("text"),
    createComment: () => createTabHostNode("comment"),
    setText: (node, value) => {
      node.text = value;
    },
    setElementText: (node, value) => {
      node.text = value;
    },
    patchProp: (node, key, previous, value) => {
      node.props[key] = value;
    },
    parentNode: (node) => node.parent,
    nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] ?? null,
    insert: (node, parent, anchor = null) => {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
      node.parent = parent;
      const index = anchor ? parent.children.indexOf(anchor) : -1;
      parent.children.splice(index < 0 ? parent.children.length : index, 0, node);
    },
    remove: (node) => {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
      node.parent = null;
    },
  });
  const state = Object.fromEntries(["relations", "categories", "behaviors", "filteredProperties"].map((key) => [key, Vue.ref([])]));
  for (const key of ["relationStatus", "categoryStatus", "behaviorStatus", "propertyStatus"]) state[key] = Vue.ref("empty");
  for (const key of ["relationError", "categoryError", "behaviorError", "propertyError"]) state[key] = Vue.ref("");
  Object.assign(state, {
    selectedCategoryId: Vue.ref("all"),
    selectedBehaviorCategoryId: Vue.ref("all"),
    behaviorPage: Vue.ref(1),
    behaviorPageSize: 8,
    behaviorTotal: Vue.ref(0),
    usingListProperties: Vue.ref(false),
  });
  const empty = Vue.defineComponent({ render: () => null });
  const component = compileProfileComponent(
    "ObjectProfileEntityDetail",
    (id) => {
      if (id === "vue") return Vue;
      if (id.includes("useObjectProfileEntityDetail")) return { useObjectProfileEntityDetail: () => state };
      return { __esModule: true, default: empty };
    },
    true,
  );
  const target = Vue.markRaw(createTabHostNode("header")),
    root = createTabHostNode("root");
  const app = renderer.createApp(component, { objectId: "a", instanceId: "0", spaceId: "156", entityName: "甲", tabsTarget: target });
  try {
    app.mount(root);
    const nav = target.children.find((node) => node.type === "nav");
    assert.ok(nav);
    assert.equal(nav.props.role, "tablist");
    const buttons = nav.children.filter((node) => node.type === "button");
    assert.deepEqual(
      buttons.map((node) => node.text.trim()),
      ["属性", "关系", "行为"],
    );
    assert.equal(buttons[0].props["aria-selected"], true);
    buttons[2].props.onClick();
    await Vue.nextTick();
    assert.equal(buttons[2].props["aria-selected"], true);
    assert.equal(buttons[0].props["aria-selected"], false);
    assert.equal(
      root.children[0].children.some((node) => node.type === "nav"),
      false,
    );
  } finally {
    app.unmount();
  }
  assert.equal(target.children.length, 0);
});

test("shared 3D component enforces readonly mode, retries errors, refreshes theme and releases observers", async () => {
  let mount,
    unmount,
    menu,
    fail = false;
  const events = [],
    emitted = [];
  const isDark = Vue.ref(false);
  const previousObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    /** @description 记录尺寸观察器启动。 */
    observe() {
      events.push("observe");
    }
    /** @description 记录尺寸观察器断开。 */
    disconnect() {
      events.push("disconnect");
    }
  };
  const component = compileProfileComponent("OntologyRelationGraph3d", (id) => {
    if (id === "vue")
      return {
        ...Vue,
        onMounted: (callback) => {
          mount = callback;
        },
        onBeforeUnmount: (callback) => {
          unmount = callback;
        },
      };
    if (id.includes("useDocumentTheme")) return { useDocumentTheme: () => ({ isDark }) };
    if (id.includes("createRelationGraph3d"))
      return {
        createRelationGraph3d: (options) => {
          menu = options.onEdgeContextMenu;
          events.push("create");
          return {
            setData: async (data) => {
              if (fail) throw new Error("WebGL unavailable");
              events.push([data.items.length, data.layoutMode]);
            },
            /** @description 隔离不影响组件状态验证的画布尺寸更新。 */
            resize() {},
            refreshTheme: () => events.push("theme"),
            dispose: () => events.push("dispose"),
          };
        },
      };
    return {};
  });
  const props = Vue.reactive({ items: [{ id: "r" }], layoutMode: "network", seedNames: ["甲"], maxHop: 2, readonly: true });
  const scope = Vue.effectScope();
  try {
    const page = scope.run(() => component.setup(props, { expose() {}, emit: (...args) => emitted.push(args) }));
    page.canvasRef.value = {};
    page.rootRef.value = { getBoundingClientRect: () => ({ left: 0, top: 0 }) };
    mount();
    await settleEntityNavigation();
    assert.equal(page.graphInitializing.value, false);
    menu("r", 10, 10);
    assert.equal(page.contextMenu.value.visible, false);
    props.readonly = false;
    menu("r", 10, 10);
    assert.equal(page.contextMenu.value.visible, true);
    page.handleEdit();
    assert.equal(emitted[0][0], "edit");
    isDark.value = true;
    await settleEntityNavigation();
    assert.ok(events.includes("theme"));
    fail = true;
    await page.syncGraph();
    assert.equal(page.graphError.value, "WebGL unavailable");
    fail = false;
    page.initializeGraph();
    await settleEntityNavigation();
    assert.equal(page.graphError.value, "");
    assert.equal(events.filter((item) => item === "create").length, 2);
    assert.equal(events.filter((item) => item === "observe").length, 1);
    unmount();
    assert.equal(events.filter((item) => item === "dispose").length, 2);
    assert.ok(events.includes("disconnect"));
    page.initializeGraph();
    assert.equal(events.filter((item) => item === "create").length, 2);
  } finally {
    scope.stop();
    if (previousObserver === undefined) delete globalThis.ResizeObserver;
    else globalThis.ResizeObserver = previousObserver;
  }
});

test("behavior cards retain descriptions and metadata without displaying behavior status", async () => {
  const component = compileProfileComponent(
    "ObjectProfileEntityBehaviors",
    (id) => {
      if (id === "vue") return Vue;
      if (id === "@element-plus/icons-vue") return { Operation: Vue.defineComponent({ render: () => null }) };
      return { __esModule: true, default: Vue.defineComponent({ render: () => null }) };
    },
    true,
  );
  const slot = Vue.defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        Vue.h("span", slots.default?.()),
  });
  for (const status of [0, 1]) {
    const app = Vue.createSSRApp(component, {
      items: [
        {
          id: 1,
          displayName: "行为名称",
          description: "保留原描述",
          actionApi: "action-api",
          functionApi: "function-api",
          actionKind: "BASE",
          status,
          updateTime: "2026-11-17",
        },
      ],
      status: "ready",
      error: "",
      page: 1,
      pageSize: 8,
      total: 1,
    });
    for (const name of ["el-icon", "el-tag", "el-button", "el-empty", "el-pagination"]) app.component(name, slot);
    const html = await renderToString(app);
    assert.doesNotMatch(html, /行为状态|已启用|已停用/);
    assert.match(html, /执行/);
    assert.match(html, /<h3[^>]*>行为名称<\/h3>/);
    assert.match(html, /class="entity-detail-behavior-card__description"[^>]*>保留原描述<\/p>/);
    for (const value of ["基础行为", "行为 API", "action-api", "挂载函数", "function-api", "更新时间", "2026-11-17"]) assert.ok(html.includes(value));
  }
});

test("entity category tree contains only API nodes and updates selection without creating a wrapper", async () => {
  const categories = Vue.ref([]);
  const selectedCategoryId = Vue.ref("all");
  const component = compileProfileComponent("ObjectProfileEntityDetail", (id) => {
    if (id === "vue") return Vue;
    if (id.includes("useObjectProfileEntityDetail"))
      return {
        useObjectProfileEntityDetail: () => ({ categories, selectedCategoryId, relations: Vue.ref([]) }),
      };
    return {};
  });
  const scope = Vue.effectScope();
  try {
    const page = scope.run(() =>
      component.setup(
        {
          objectId: "object-a",
          instanceId: "0",
          spaceId: "156",
          entityName: "实例",
        },
        { expose() {}, emit() {} },
      ),
    );
    assert.deepEqual(page.categoryTree.value, []);
    categories.value = [
      {
        id: "1",
        label: "全部属性",
        propertyIds: [],
        children: [{ id: "2", label: "性能", propertyIds: ["speed"], children: [] }],
      },
    ];
    await Vue.nextTick();
    assert.deepEqual(page.categoryTree.value, categories.value);
    assert.equal(page.categoryTree.value[0].id, "1");
    page.selectPropertyCategory(categories.value[0].children[0]);
    assert.equal(selectedCategoryId.value, "2");
    page.selectPropertyCategory(categories.value[0]);
    assert.equal(selectedCategoryId.value, "1");
    categories.value = [];
    await Vue.nextTick();
    assert.deepEqual(page.categoryTree.value, []);
  } finally {
    scope.stop();
  }
});

/** @description 创建真实列表组件的受控接口测试环境。 @param {Function} request URL 查询接口。 @param {boolean} autoOpenDetail 是否自动打开。 @returns {object} 组件状态和生命周期。 */
function createEntityNavigation(request, autoOpenDetail = false) {
  const rows = Vue.ref([
    { rowKey: "row", ontologyUniqueIdentifier: "object-a", instanceId: "0", entityPrimaryKey: 0, cells: { 名称: "实体甲" }, detailItems: [] },
  ]);
  const events = [];
  const component = compileProfileComponent("ObjectProfileEntityList", (id) => {
    if (id === "vue") return Vue;
    if (id === "@/apis") return { getOntologyInstanceUrlListInterface: request };
    if (id.includes("useObjectProfileEntityList")) return { useObjectProfileEntityList: () => ({ filteredRows: rows, status: Vue.ref("ready") }) };
    if (id.includes("mapObjectProfileEntityRows")) return { readObjectProfileEntityPrimaryKey };
    if (id === "element-plus") return { ElMessage: { error: (message) => events.push(message) } };
    return {};
  });
  const props = Vue.reactive({ objectId: "object-a", spaceId: "156", autoOpenDetail });
  const scope = Vue.effectScope();
  const page = scope.run(() => component.setup(props, { expose() {}, emit: (...args) => events.push(args) }));
  return { page, rows, props, events, scope };
}

/** @description 等待组件接口 Promise 及 Vue 观察器完成。 @returns {Promise<void>} 完成信号。 */
async function settleEntityNavigation() {
  await new Promise((resolve) => setImmediate(resolve));
  await Vue.nextTick();
}

test("entity details query URL with current identity and use first nonblank URL", async () => {
  const calls = [];
  const { page, rows, events, scope } = createEntityNavigation(async (params) => {
    calls.push(params);
    return { code: 200, data: [{ url: " " }, { url: " https://example.com/entity/0 " }, { url: "https://example.com/other" }] };
  });
  try {
    assert.equal(page.openEntityDetail(rows.value[0]), true);
    assert.equal(page.detailStatus.value, "loading");
    assert.ok(events.some((event) => event[0] === "detail-visibility-change" && event[1] === true));
    assert.ok(events.some((event) => event[0] === "detail-name-change" && event[1] === "实体甲"));
    assert.equal(page.openEntityDetail(rows.value[0]), false);
    await settleEntityNavigation();
    assert.deepEqual(calls, [{ spaceId: 156, objectId: "object-a", instanceId: "0" }]);
    assert.equal(page.detailStatus.value, "external");
    assert.equal(page.detailUrl.value, "https://example.com/entity/0");
    page.closeEntityDetail();
    assert.equal(page.detailUrl.value, "");
    assert.equal(page.detailStatus.value, "idle");
    assert.ok(events.some((event) => event[0] === "detail-name-change" && event[1] === ""));
    assert.ok(events.some((event) => event[0] === "detail-visibility-change" && event[1] === false));
    assert.equal(page.selectedEntity.value, null);
  } finally {
    scope.stop();
  }
});

for (const [label, response] of [
  ["empty list", { code: 200, data: [] }],
  ["blank URL", { code: 200, data: [{ url: "  " }, {}] }],
  ["null data", { code: 200, data: null }],
  ["failed response", { code: 500, message: "查询失败", data: [{ url: "https://example.com" }] }],
  ["network error", new Error("network")],
])
  test("entity details fall back to native detail on " + label, async () => {
    const { page, rows, scope } = createEntityNavigation(async () => {
      if (response instanceof Error) throw response;
      return response;
    });
    try {
      page.openEntityDetail(rows.value[0]);
      await settleEntityNavigation();
      assert.equal(page.detailStatus.value, "native");
      assert.equal(page.detailUrl.value, "");
      assert.equal(page.selectedEntity.value.entityPrimaryKey, 0);
    } finally {
      scope.stop();
    }
  });

test("late entity URL responses cannot reopen closed or switched or disposed details", async () => {
  for (const action of ["close", "switch", "dispose"]) {
    let finish;
    const { page, rows, props, scope } = createEntityNavigation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    page.openEntityDetail(rows.value[0]);
    if (action === "close") page.closeEntityDetail();
    if (action === "switch") {
      props.objectId = "object-b";
      await Vue.nextTick();
    }
    if (action === "dispose") scope.stop();
    const previous = page.detailStatus.value;
    finish({ code: 200, data: [{ url: "https://example.com/late" }] });
    await settleEntityNavigation();
    assert.equal(page.detailUrl.value, "");
    assert.equal(page.detailStatus.value, previous);
    if (action !== "dispose") assert.equal(page.selectedEntity.value, null);
    scope.stop();
  }
});

test("new instance URL result wins over older request including late rejection", async () => {
  let rejectFirst;
  const { page, rows, scope } = createEntityNavigation(({ instanceId }) =>
    instanceId === "0"
      ? new Promise((_, reject) => {
          rejectFirst = reject;
        })
      : Promise.resolve({ code: 200, data: [{ url: "https://example.com/new" }] }),
  );
  try {
    page.openEntityDetail(rows.value[0]);
    page.openEntityDetail({ ...rows.value[0], instanceId: "2", entityPrimaryKey: 2 });
    await settleEntityNavigation();
    rejectFirst(new Error("late failure"));
    await settleEntityNavigation();
    assert.equal(page.detailUrl.value, "https://example.com/new");
    assert.equal(page.selectedEntity.value.entityPrimaryKey, 2);
    assert.equal(page.detailStatus.value, "external");
  } finally {
    scope.stop();
  }
});

test("automatic detail opening queries URL once and falls back without losing identity", async () => {
  let calls = 0;
  const { page, events, scope } = createEntityNavigation(async () => {
    calls++;
    return { code: 200, data: [] };
  }, true);
  try {
    await settleEntityNavigation();
    assert.equal(calls, 1);
    assert.equal(page.detailStatus.value, "native");
    assert.equal(page.selectedEntity.value.instanceId, "0");
    assert.equal(events.filter(([name]) => name === "detail-auto-opened").length, 1);
  } finally {
    scope.stop();
  }
});
