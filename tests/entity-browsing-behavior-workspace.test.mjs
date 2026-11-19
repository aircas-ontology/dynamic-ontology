import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { ModuleKind, transpileModule } from "typescript";
import {
  collectBrowseCategoryIds,
  findBrowseBehaviorCategoryNode,
  omitBrowseActionLeaves,
  resolveBrowseListCategoryIdQuery,
} from "../src/views/EntityBrowsingBehavior/utils/browseBehaviorCategoryTree.ts";
import { mapBrowseActionCategoryTree } from "../src/views/EntityBrowsingBehavior/utils/mapBrowseActionCategoryTree.ts";
import {
  mapListOntologyActionRecord,
  mapSpaceBehaviorItemToListStatus,
  mapSpaceBehaviorKindToActionKindQuery,
  mapSpaceBehaviorListStatusToQuery,
} from "../src/utils/behaviorParameters/mapListOntologyActionRecord.ts";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID } from "../src/types/pages/ontologySpaceBehaviorType.ts";

const behaviorIndexSource = readFileSync(new URL("../src/views/EntityBrowsingBehavior/index.vue", import.meta.url), "utf8");
const entityBrowsingSource = readFileSync(new URL("../src/views/EntityBrowsing/index.vue", import.meta.url), "utf8");
const composableSource = readFileSync(
  new URL("../src/views/EntityBrowsingBehavior/composables/useEntityBrowsingBehaviorWorkspace.ts", import.meta.url),
  "utf8",
);

test("browse behavior page stops importing dewey mock and wires shared test dialogs", () => {
  assert.doesNotMatch(behaviorIndexSource, /deweyBehaviorMock|deweyCallTestMock|powerBehaviorInstances/);
  assert.match(behaviorIndexSource, /useEntityBrowsingBehaviorWorkspace/);
  assert.match(behaviorIndexSource, /BehaviorTestDialog/);
  assert.match(behaviorIndexSource, /show-behavior-detail-panel/);
  assert.match(behaviorIndexSource, /BehaviorTreeTestDialog/);
  assert.equal((behaviorIndexSource.match(/show-behavior-detail-panel/g) || []).length, 2);
  assert.doesNotMatch(behaviorIndexSource, /DeweyBehaviorCallTestPanel|DeweyBehaviorExecutionPanel|BehaviorCallTest/);
  const profileDetailSource = readFileSync(
    new URL("../src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityDetail.vue", import.meta.url),
    "utf8",
  );
  assert.match(profileDetailSource, /BehaviorTreeTestDialog/);
  assert.equal((profileDetailSource.match(/show-behavior-detail-panel/g) || []).length, 2);
});

test("browse behavior category tree hides node count statistics", () => {
  const categorySource = readFileSync(new URL("../src/views/EntityBrowsingBehavior/components/BehaviorCategoryPanel.vue", import.meta.url), "utf8");
  assert.doesNotMatch(categorySource, /data\.count|behavior-category-panel__count/);
});

test("browse behavior cards omit status field from card metadata", () => {
  const panelSource = readFileSync(new URL("../src/views/EntityBrowsingBehavior/components/BehaviorInstancePanel.vue", import.meta.url), "utf8");
  assert.doesNotMatch(panelSource, /<dt>状态<\/dt>/);
  assert.doesNotMatch(panelSource, /SPACE_BEHAVIOR_LIST_STATUS_LABELS|mapSpaceBehaviorItemToListStatus/);
});

test("browse behavior cards open detail from button and whole-card click", () => {
  const panelSource = readFileSync(new URL("../src/views/EntityBrowsingBehavior/components/BehaviorInstancePanel.vue", import.meta.url), "utf8");
  assert.match(panelSource, />详情</);
  assert.doesNotMatch(panelSource, /调用测试/);
  assert.match(panelSource, /@click="emit\('detail', item\)"/);
  assert.match(panelSource, /@click\.stop="emit\('detail', item\)"/);
  assert.match(panelSource, /role="button"/);
  assert.match(panelSource, /behavior-instance-card__footer-row/);
  assert.match(behaviorIndexSource, /@detail="openBrowseBehaviorTest"/);
});

test("entity browsing tab count no longer uses dewey static instance length", () => {
  assert.doesNotMatch(entityBrowsingSource, /powerBehaviorInstances/);
  assert.match(entityBrowsingSource, /useEntityBrowseBehaviorCount|behaviorTotal/);
  const countSource = readFileSync(new URL("../src/views/EntityBrowsing/composables/useEntityBrowseBehaviorCount.ts", import.meta.url), "utf8");
  assert.match(countSource, /getListOntologyActionInterface/);
  assert.match(countSource, /status:\s*1/);
});

test("browse behavior composable calls real category and list interfaces", () => {
  assert.match(composableSource, /getActionCategoryTreeInterface/);
  assert.match(composableSource, /getListOntologyActionInterface/);
  assert.match(composableSource, /mapListOntologyActionRecord/);
  assert.match(composableSource, /PUBLISHED_BEHAVIOR_STATUS|status:\s*PUBLISHED_BEHAVIOR_STATUS/);
});

test("mapBrowseActionCategoryTree maps nested categories and counts action leaves", () => {
  const tree = mapBrowseActionCategoryTree({
    children: [
      {
        id: 10,
        name: "基础",
        children: [{ id: 11, name: "属性", actionInfos: [{ actionApi: "act.a", displayName: "A" }] }],
        actionInfos: [{ actionApi: "act.b", displayName: "B" }],
      },
    ],
  });
  assert.equal(tree.length, 1);
  assert.equal(tree[0].id, "10");
  assert.equal(tree[0].count, 2);
  assert.equal(tree[0].children.filter((node) => node.kind === "action").length, 1);
  assert.equal(tree[0].children.find((node) => node.id === "11")?.count, 1);
});

test("mapBrowseActionCategoryTree supports legacy items, ontology filter and rejects incomplete nodes", () => {
  const withItems = mapBrowseActionCategoryTree([
    {
      id: 1,
      name: "根",
      items: {
        id: 2,
        categoryName: "子项",
        actionInfos: [
          { actionApi: "  ", displayName: "空" },
          { actionApi: "act.z", displayName: "" },
        ],
      },
    },
  ]);
  assert.equal(withItems[0].children[0]?.id, "2");
  assert.equal(
    withItems[0].children[0]?.children.some((node) => node.actionApi === "act.z"),
    true,
  );
  const filtered = mapBrowseActionCategoryTree(
    [
      {
        id: 3,
        name: "过滤",
        actionInfos: [
          { actionApi: "act.keep", displayName: "留", ontologyUniqIdentifier: "obj-a" },
          { actionApi: "act.drop", displayName: "丢", ontologyUniqIdentifier: "obj-b" },
        ],
      },
    ],
    { ontologyUniqIdentifier: "obj-a" },
  );
  assert.equal(filtered[0].count, 1);
  assert.equal(filtered[0].children[0]?.actionApi, "act.keep");
  assert.throws(() => mapBrowseActionCategoryTree([{ name: "缺 id" }]), /缺少节点 id 或名称/);
  assert.throws(() => mapBrowseActionCategoryTree([{ id: 9 }]), /缺少节点 id 或名称/);
});

test("omitBrowseActionLeaves keeps only category nodes for filter tree", () => {
  const tree = mapBrowseActionCategoryTree([
    {
      id: 1,
      name: "根",
      actionInfos: [{ actionApi: "act.x", displayName: "X" }],
      children: [{ id: 2, name: "子", actionInfos: [{ actionApi: "act.y", displayName: "Y" }] }],
    },
  ]);
  const categoriesOnly = omitBrowseActionLeaves(tree);
  assert.equal(
    categoriesOnly[0].children.every((node) => node.kind === "category"),
    true,
  );
  assert.deepEqual(collectBrowseCategoryIds(categoriesOnly), ["1", "2"]);
  assert.equal(findBrowseBehaviorCategoryNode(categoriesOnly, "2")?.label, "子");
});

test("resolveBrowseListCategoryIdQuery skips root and invalid ids", () => {
  const tree = [{ id: "1", label: "根", kind: "category", count: 0, children: [{ id: "2", label: "子", kind: "category", count: 0, children: [] }] }];
  assert.equal(resolveBrowseListCategoryIdQuery(ROOT_SPACE_BEHAVIOR_CATEGORY_ID, tree), undefined);
  assert.equal(resolveBrowseListCategoryIdQuery("1", tree), undefined);
  assert.equal(resolveBrowseListCategoryIdQuery("2", tree), 2);
  assert.equal(resolveBrowseListCategoryIdQuery("abc", tree), undefined);
});

const sampleRecord = {
  id: 9,
  actionApi: "act.1",
  displayName: "行为一",
  actionKind: "BASE",
  subjectType: "PROPERTY_VALUE",
  categoryId: 3,
  status: 1,
  ontologyUniqIdentifier: "obj-1",
  functionApi: "fn.a",
  functionDescription: "",
  description: "desc",
  updateTime: "2026-01-01 00:00:00",
  operation: "CREATE",
  storageGroup: "main",
  outputMode: null,
};

test("browse list mapping covers status kind filters and action kinds", () => {
  assert.equal(mapSpaceBehaviorListStatusToQuery("published"), 1);
  assert.equal(mapSpaceBehaviorListStatusToQuery("draft"), 2);
  assert.equal(mapSpaceBehaviorListStatusToQuery(""), undefined);
  assert.equal(mapSpaceBehaviorKindToActionKindQuery("basic"), "BASE");
  assert.equal(mapSpaceBehaviorKindToActionKindQuery("application"), "APPLICATION");
  assert.equal(mapSpaceBehaviorKindToActionKindQuery("behaviorTree"), "TREE");
  assert.equal(mapSpaceBehaviorKindToActionKindQuery(""), undefined);
  const basic = mapListOntologyActionRecord({
    ...sampleRecord,
    actionKind: "BASE",
    subjectType: "PROPERTY_VALUE",
    operation: "UPDATE",
    status: 1,
  });
  const application = mapListOntologyActionRecord({
    ...sampleRecord,
    actionKind: "APPLICATION",
    subjectType: "BASIC_FUNCTION",
    operation: "DELETE",
    status: 2,
    functionApi: null,
    functionDescription: "描述函数",
  });
  const tree = mapListOntologyActionRecord({
    ...sampleRecord,
    actionKind: "TREE",
    subjectType: "LINK",
    operation: "QUERY",
    status: 0,
    displayName: "  ",
    actionApi: "act.tree",
    updateTime: null,
  });
  assert.equal(basic.kind, "basic");
  assert.equal(basic.basicAction, "update");
  assert.equal(mapSpaceBehaviorItemToListStatus(basic.status), "published");
  assert.equal(application.kind, "application");
  assert.equal(application.functionOperatorName, "描述函数");
  assert.equal(mapSpaceBehaviorItemToListStatus(application.status), "draft");
  assert.equal(tree.kind, "behaviorTree");
  assert.equal(tree.valueType, "relationInstance");
  assert.equal(tree.displayName, "act.tree");
  assert.equal(tree.updatedAt, "-");
});

/**
 * @description 使用真实 Vue 状态与业务映射，隔离 HTTP 边界挂载浏览行为工作区。
 * @param {{ spaceId?: string, apis?: object }} options 空间与接口替身。
 * @returns {{ workspace: object, scope: object, spaceId: object, calls: object }} 工作区状态。
 */
function createBrowseBehaviorHarness(options = {}) {
  const calls = { category: 0, list: [] };
  const source = readFileSync(new URL("../src/views/EntityBrowsingBehavior/composables/useEntityBrowsingBehaviorWorkspace.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return Vue;
    if (id === "vue-router") return { useRoute: () => ({ params: { spaceId: options.spaceId ?? "12" } }) };
    if (id === "@/apis")
      return {
        getActionCategoryTreeInterface: async () => {
          calls.category += 1;
          return { code: 200, data: [{ id: 3, name: "分类甲", actionInfos: [{ actionApi: "act.1", displayName: "行为一" }] }] };
        },
        getListOntologyActionInterface: async (params) => {
          calls.list.push(params);
          return { code: 200, data: { records: [sampleRecord], total: 1 } };
        },
        ...options.apis,
      };
    if (id === "@/types") return { ROOT_SPACE_BEHAVIOR_CATEGORY_ID };
    if (id.includes("mapListOntologyActionRecord"))
      return { mapListOntologyActionRecord, mapSpaceBehaviorKindToActionKindQuery, mapSpaceBehaviorListStatusToQuery };
    if (id.includes("browseBehaviorCategoryTree"))
      return {
        findBrowseBehaviorCategoryNode,
        omitBrowseActionLeaves,
        resolveBrowseListCategoryIdQuery,
      };
    if (id.includes("mapBrowseActionCategoryTree")) return { mapBrowseActionCategoryTree };
    throw new Error(id);
  }, exports);
  const spaceId = Vue.ref(options.spaceId ?? "12");
  const scope = Vue.effectScope();
  const workspace = scope.run(() =>
    exports.useEntityBrowsingBehaviorWorkspace({
      getSpaceId: () => spaceId.value,
      ...(options.apis
        ? {
            getActionCategoryTreeInterface: options.apis.getActionCategoryTreeInterface,
            getListOntologyActionInterface: options.apis.getListOntologyActionInterface,
          }
        : {}),
    }),
  );
  return { workspace, scope, spaceId, calls };
}

/** @description 等待请求与 Vue 侦听器结算。 */
async function settleBrowseRequests() {
  for (let index = 0; index < 8; index += 1) await Vue.nextTick();
}

test("browse behavior workspace loads category tree and list from injected interfaces", async () => {
  const { workspace, calls, scope } = createBrowseBehaviorHarness();
  try {
    await settleBrowseRequests();
    assert.equal(calls.category, 1);
    assert.equal(calls.list.length, 1);
    assert.equal(calls.list[0].ontologySpaceId, 12);
    assert.equal(calls.list[0].status, 1);
    assert.equal(workspace.status.value, "ready");
    assert.equal(workspace.total.value, 1);
    assert.equal(workspace.behaviors.value[0]?.behaviorApiName, "act.1");
    assert.equal(workspace.categoryTree.value[0]?.id, "3");
  } finally {
    scope.stop();
  }
});

test("browse behavior workspace rejects stale list responses after category switch", async () => {
  const pending = [];
  let listCalls = 0;
  const { workspace, scope } = createBrowseBehaviorHarness({
    apis: {
      getActionCategoryTreeInterface: async () => ({
        code: 200,
        data: [{ id: 1, name: "根", children: [{ id: 2, name: "子类" }] }],
      }),
      getListOntologyActionInterface: (params) => {
        listCalls += 1;
        return new Promise((resolve) => pending.push({ params, resolve }));
      },
    },
  });
  try {
    await settleBrowseRequests();
    assert.equal(pending.length, 1);
    workspace.selectBehaviorCategory("2");
    await settleBrowseRequests();
    assert.equal(pending.length, 2);
    pending[0].resolve({
      code: 200,
      data: { records: [{ ...sampleRecord, id: 1, actionApi: "old", displayName: "旧", categoryId: 1 }], total: 1 },
    });
    await settleBrowseRequests();
    pending[1].resolve({
      code: 200,
      data: {
        records: [{ ...sampleRecord, id: 2, actionApi: "new", displayName: "新", actionKind: "APPLICATION", categoryId: 2 }],
        total: 1,
      },
    });
    await settleBrowseRequests();
    assert.equal(pending[1].params.categoryId, 2);
    assert.equal(workspace.behaviors.value[0]?.behaviorApiName, "new");
    assert.equal(
      workspace.behaviors.value.some((item) => item.behaviorApiName === "old"),
      false,
    );
  } finally {
    scope.stop();
  }
});

test("browse behavior workspace surfaces list errors and supports retry", async () => {
  let attempts = 0;
  const { workspace, scope } = createBrowseBehaviorHarness({
    apis: {
      getActionCategoryTreeInterface: async () => ({ code: 200, data: [{ id: 1, name: "分类" }] }),
      getListOntologyActionInterface: async () => {
        attempts += 1;
        if (attempts === 1) return { code: 500, message: "列表失败" };
        return { code: 200, data: { records: [], total: 0 } };
      },
    },
  });
  try {
    await settleBrowseRequests();
    assert.equal(workspace.status.value, "error");
    assert.match(workspace.errorMessage.value, /列表失败/);
    await workspace.loadBrowseBehaviorWorkspace();
    await settleBrowseRequests();
    assert.equal(workspace.status.value, "ready");
    assert.equal(workspace.total.value, 0);
  } finally {
    scope.stop();
  }
});
