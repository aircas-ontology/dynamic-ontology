import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMemoryHistory, createRouter } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";
import { findSpaceById } from "../src/views/OntologySpaceManagementDetail/utils/spaceLookup.ts";
import { tabFromRouteName, routeNameForTab } from "../src/views/OntologySpaceManagementDetail/utils/workspaceTabs.ts";
import { useOntologySpaceDetailStore } from "../src/stores/useOntologySpaceDetailStore.ts";
import ts from "typescript";
import { computed, ref } from "vue";

test("conceptual entry navigates with the currently loaded space and preserves query", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/index.vue", import.meta.url), "utf8");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const space = ref({ id: "42", displayName: "舰船", apiName: "ships" });
  const status = ref("ready");
  const destinations = [];
  const route = { query: { from: "theme-space-management", userName: "user", spaceName: "旧名称" }, name: "OntologySpaceManagementDetailObject" };
  const dependencies = {
    computed,
    useRoute: () => route,
    useRouter: () => ({ push: (target) => destinations.push(target) }),
    useSpaceWorkspace: () => ({ status, space, error: ref(""), spaceId: ref("42"), activeTab: ref("object"), availableTabs: ref([]), load: () => {} }),
    useSpaceOverview: () => ({ data: ref(null), loading: ref(false) }),
    useOnboardingGuide: () => ({ visible: ref(false), startId: ref(""), openOnboardingGuide: () => {} }),
    ONBOARDING_GUIDE_ENTRY_IDS: {},
    ONBOARDING_GUIDE_STEPS: [],
    THEME_ONBOARDING_GUIDE_STEPS: [],
  };
  const state = new Function(...Object.keys(dependencies), ts.transpile(`${script}\nreturn { openConceptualModel };`, { target: ts.ScriptTarget.ES2022 }))(
    ...Object.values(dependencies),
  );
  state.openConceptualModel();
  assert.deepEqual(destinations[0], {
    name: "OntologyConceptualModelCreate",
    query: { from: "theme-space-management", userName: "user", spaceName: "舰船", spaceId: "42", spaceApiName: "ships" },
  });
  space.value = { id: "43", displayName: "飞机", apiName: "planes" };
  state.openConceptualModel();
  assert.equal(destinations[1].query.spaceId, "43");
  status.value = "loading";
  state.openConceptualModel();
  assert.equal(destinations.length, 2);
});

test("space detail parent and child routes resolve under the workspace layout", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const objectRoute = router.resolve({ name: "OntologySpaceManagementDetailObject", params: { spaceId: "army" } });
  assert.equal(objectRoute.path, "/workspace/ontology-space-management/army/object");
  assert.deepEqual(
    objectRoute.matched.map((record) => record.name),
    ["Workspace", "OntologySpaceManagementDetail", "OntologySpaceManagementDetailObject"],
  );

  const functionRoute = router.resolve({
    name: "OntologySpaceManagementDetailFunctionOperator",
    params: { spaceId: "navy" },
  });
  assert.equal(functionRoute.path, "/workspace/ontology-space-management/navy/function-operator");

  const llmRoute = router.resolve({ name: "OntologyLlmBuilder", params: { spaceId: "navy" } });
  assert.equal(llmRoute.path, "/workspace/ontology-space-management/navy/llm-builder");

  const subspaceRoute = router.resolve({ name: "OntologySubspaceCreate", params: { spaceId: "navy" } });
  assert.equal(subspaceRoute.path, "/workspace/ontology-space-management/navy/subspace-create");
  assert.equal(subspaceRoute.matched.at(-1)?.components?.default.toString().includes("OntologySubspaceCreate"), true);
});

test("subspace create page composes left tree and right workspace panels", () => {
  const source = readFileSync(new URL("../src/views/OntologySubspaceCreate/index.vue", import.meta.url), "utf8");
  assert.match(source, /class="ontology-subspace-create"/);
  assert.match(source, /aria-label="创建主题"/);
  assert.match(source, /SubspaceCreateTreePanel/);
  assert.match(source, /SubspaceCreateWorkspacePanel/);
  assert.doesNotMatch(source, /<el-tree/);
  assert.doesNotMatch(source, /AI 助手/);
});

test("theme space create back button follows the route history", () => {
  const source = readFileSync(new URL("../src/views/OntologySubspaceCreate/index.vue", import.meta.url), "utf8");
  assert.match(source, /function goBackToSpaceList\(\)[\s\S]*router\.back\(\)/);
  assert.doesNotMatch(source, /function goBackToSpaceList\(\)[\s\S]*router\.push\(\{ name: "OntologySpaceManagement" \}/);
});

test("space detail parent redirects to the object tab for a space id", () => {
  const detailRoute = workspaceRoutes[0]?.children?.find((route) => route.name === "OntologySpaceManagementDetail");
  assert.ok(detailRoute);
  assert.deepEqual(detailRoute.redirect, { name: "OntologySpaceManagementDetailObject" });
  assert.equal(detailRoute.children?.length, 7);
  assert.equal(
    detailRoute.children?.some((route) => route.name === "OntologySpaceManagementDetailOverview"),
    false,
  );
});

test("theme space creation resolves its selected parent from object spaces", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/composables/useSpaceWorkspace.ts", import.meta.url), "utf8");
  assert.match(source, /route\.query\.from === "theme-space-management"/);
  assert.match(source, /route\.name !== "OntologySubspaceCreate"/);
  assert.match(source, /getOntologySpaceListInterface\(\{ type: isThemeSpaceDetail \? 1 : 0 \}\)/);
});

test("space lookup returns mock space or null", () => {
  const spaces = [
    {
      id: "army",
      apiName: "army_space",
      displayName: "陆军对象空间",
      description: "",
      iconUrl: "",
      category: "陆军",
      metrics: { ontology: 1, behavior: 1, relation: 1, rule: 1, source: 1 },
      createdAt: "",
      createdBy: "admin",
      updatedAt: "",
      isSubspace: false,
      parentSpaceDisplayName: "",
    },
  ];
  assert.equal(findSpaceById(spaces, "army")?.displayName, "陆军对象空间");
  assert.equal(findSpaceById(spaces, "missing"), null);
});

test("workspace tab helpers map route names and tab ids", () => {
  assert.equal(routeNameForTab("relation"), "OntologySpaceManagementDetailRelation");
  assert.equal(tabFromRouteName("OntologySpaceManagementDetailBehaviorSchedule"), "behavior-schedule");
  assert.equal(tabFromRouteName("Unknown"), null);
});

test("ontology space detail store keeps and clears the breadcrumb space name", () => {
  setActivePinia(createPinia());
  const store = useOntologySpaceDetailStore();
  store.setCurrentSpace("army", "陆军对象空间");
  assert.equal(store.spaceId, "army");
  assert.equal(store.displayName, "陆军对象空间");
  store.clearCurrentSpace();
  assert.equal(store.spaceId, "");
  assert.equal(store.displayName, "");
});

test("space management enter action navigates to the object tab route", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts", import.meta.url), "utf8");
  assert.match(source, /action === ["']enter["']/);
  assert.match(source, /OntologySpaceManagementDetailObject/);
});

test("breadcrumb includes the current space name while inside a space", () => {
  const source = readFileSync(new URL("../src/layout/components/BreadcrumbBar.vue", import.meta.url), "utf8");
  assert.match(source, /OntologySpaceManagement/);
  assert.match(source, /displayName|spaceDisplayName/);
  assert.match(source, /useOntologySpaceDetailStore/);
});

test("workspace type tabs keep prototype labels including function operator", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/components/WorkspaceTypeTabs.vue", import.meta.url), "utf8");
  assert.match(source, /函数算子/);
  assert.match(source, /行为调度/);
  assert.match(source, /workspace-type-tabs/);
  assert.match(source, /background: linear-gradient\(135deg, var\(--aircas-color-panel-background\), var\(--aircas-color-panel-background-deep\)\)/);
  assert.match(
    source,
    /:root:not\(\.dark\) \.workspace-type-tabs[\s\S]*linear-gradient\(135deg, var\(--aircas-color-card-background\), var\(--aircas-color-panel-background-deep\)\)/,
  );
  assert.match(source, /box-shadow: inset 0 0 20px var\(--aircas-color-effect-page-glow\)/);
});

test("workspace type tabs show resource counts as text suffix", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/components/WorkspaceTypeTabs.vue", import.meta.url), "utf8");
  assert.match(source, /counts\?: Partial<Record<ManagementWorkspaceTab, number>>/);
  assert.match(source, /countsLoading\?: boolean/);
  assert.match(source, /formatOverviewStat/);
  assert.match(source, /workspace-type-tabs__count/);
  assert.match(source, /workspace-type-tabs__item-active \.workspace-type-tabs__count/);
});

test("space detail layout loads overview statistics once and passes counts to tabs", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/index.vue", import.meta.url), "utf8");
  assert.match(source, /useSpaceOverview\(spaceId\)/);
  assert.match(source, /:counts="spaceOverviewCounts"/);
  assert.match(source, /:counts-loading="spaceOverviewCountsLoading"/);
  assert.doesNotMatch(source, /:space-name=/);
  assert.doesNotMatch(source, /SPACE_OVERVIEW_KEY/);
});
