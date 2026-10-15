import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { filterSpaces, saveSpace, removeSpace, parseSpaceImport, serializeSpace } from "../src/views/OntologySpaceManagement/utils/spaceOperations.ts";
import { createMemoryHistory, createRouter } from "vue-router";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";

const draft = { apiName: "demo_space", displayName: "演示空间", description: "示例", iconUrl: "" };
test("default pagination displays ten spaces and keeps the remainder on page two", () => {
  const spaces = Array.from({ length: 12 }, (_, index) => saveSpace([], { ...draft, apiName: `space_${index}` })[0]);
  assert.equal(filterSpaces(spaces, "", "asc", 1).items.length, 10);
  assert.equal(filterSpaces(spaces, "", "asc", 2).items.length, 2);
});
test("create, update, duplicate API validation and deletion preserve input", () => {
  const spaces = saveSpace([], draft);
  assert.equal(spaces.length, 1);
  assert.throws(() => saveSpace(spaces, draft), /API/);
  const edited = saveSpace(spaces, { ...draft, displayName: "修改" }, spaces[0].id);
  assert.equal(edited[0].displayName, "修改");
  assert.equal(spaces[0].displayName, "演示空间");
  assert.equal(removeSpace(edited, spaces[0].id).length, 0);
  assert.throws(() => saveSpace(spaces, draft, "missing"), /不存在/);
  assert.throws(() => saveSpace([], { ...draft, apiName: "9bad" }), /API/);
  assert.throws(() => saveSpace([], { ...draft, displayName: " " }), /名称/);
});
test("search trims and ignores case, sort and pagination do not mutate data", () => {
  let spaces = saveSpace([], draft);
  spaces = saveSpace(spaces, { ...draft, apiName: "alpha", displayName: "Alpha" });
  assert.equal(filterSpaces(spaces, " ALPHA ", "asc", 1, 5).total, 1);
  assert.equal(filterSpaces(spaces, "missing", "asc", 1, 5).items.length, 0);
  const first = filterSpaces(spaces, "", "asc", 1, 1);
  const last = filterSpaces(spaces, "", "desc", 1, 1);
  assert.notEqual(first.items[0].id, last.items[0].id);
  assert.equal(filterSpaces(spaces, "", "asc", 99, 1).page, 2);
  assert.equal(spaces[0].displayName, "演示空间");
});
test("export imports consistently and rejects malformed or incomplete data", () => {
  const [space] = saveSpace([], draft);
  assert.deepEqual(parseSpaceImport(serializeSpace(space)), draft);
  for (const value of ["no json", "{}", "null", '{"ontologySpace":{"apiName":4}}']) {
    assert.throws(() => parseSpaceImport(value));
  }
});

test("workspace child route resolves to the space management page under the layout", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "OntologySpaceManagement" });
  assert.equal(route.path, "/workspace/ontology-space-management");
  assert.deepEqual(
    route.matched.map((record) => record.name),
    ["Workspace", "OntologySpaceManagement"],
  );
  assert.equal(route.meta.title, "对象空间管理");
});

test("theme space management route and navigation item are registered below object spaces", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "ThemeSpaceManagement" });
  assert.equal(route.path, "/workspace/theme-space-management");
  assert.equal(route.meta.title, "主题空间管理");
  const navigationSource = readFileSync(new URL("../src/layout/components/NavigationMenu.vue", import.meta.url), "utf8");
  assert.match(navigationSource, /对象空间管理[\s\S]*主题空间管理/);
  assert.match(navigationSource, /name: 'ThemeSpaceManagement'/);
});

test("theme space create dialog confirms into the subspace create flow with route context", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "OntologySubspaceCreate", params: { spaceId: "object-default" } });
  assert.equal(route.path, "/workspace/ontology-space-management/object-default/subspace-create");
  assert.equal(route.meta.title, "创建主题空间");
  const source = readFileSync(new URL("../src/views/ThemeSpaceManagement/index.vue", import.meta.url), "utf8");
  assert.match(source, /useRouter/);
  assert.match(source, /请选择对象空间/);
  assert.match(source, /name: "OntologySubspaceCreate"/);
  assert.match(source, /params:\s*\{\s*spaceId:\s*selectedSpace\.id\s*\}/);
  assert.match(source, /spaceName: selectedSpace\.displayName/);
  assert.match(source, /from: "theme-space-management"/);
  assert.match(source, /getOntologySpaceListInterface\(\{ type: 1 \}\)/);
  assert.match(source, /loadThemeSpaces/);
  assert.doesNotMatch(source, /theme_finance/);
  assert.doesNotMatch(source, /新建主题空间功能暂未接入/);
});

test("theme space cards and table rows enter the space management detail with route context", () => {
  const source = readFileSync(new URL("../src/views/ThemeSpaceManagement/index.vue", import.meta.url), "utf8");
  assert.match(source, /function enterThemeSpace/);
  assert.match(source, /name: "OntologySpaceManagementDetailOverview"/);
  assert.match(source, /from: "theme-space-management"/);
  assert.doesNotMatch(source, /notifyUnavailable\('进入主题空间'\)/);
  assert.doesNotMatch(source, /进入主题空间功能暂未接入/);
});

test("theme space cards keep a single-line description and equal row height", () => {
  const source = readFileSync(new URL("../src/views/ThemeSpaceManagement/index.vue", import.meta.url), "utf8");
  assert.match(source, /\.theme-space-management__grid\s*\{[\s\S]*align-items:\s*stretch/);
  assert.match(source, /\.theme-space-management__grid\s*\{[\s\S]*align-content:\s*start/);
  assert.doesNotMatch(source, /\.theme-space-card\s*\{[\s\S]*height:\s*100%/);
  assert.match(source, /\.theme-space-card p\s*\{[\s\S]*text-overflow:\s*ellipsis[\s\S]*white-space:\s*nowrap/);
});

test("theme space editing uses the shared ontology space update interface", () => {
  const source = readFileSync(new URL("../src/views/ThemeSpaceManagement/index.vue", import.meta.url), "utf8");
  assert.match(source, /updateOntologySpaceInterface/);
  assert.match(source, /spaceId,\s*displayName,\s*iconUrl: editDraft\.value\.iconUrl,\s*description/);
  assert.match(source, /await loadThemeSpaces\(\)/);
  assert.doesNotMatch(source, /编辑主题空间功能暂未接入/);
});

test("theme space cards, tables and editing dialog support image placeholders and uploads", () => {
  const source = readFileSync(new URL("../src/views/ThemeSpaceManagement/index.vue", import.meta.url), "utf8");
  assert.match(source, /<Box \/>/);
  assert.match(source, /postUploadOntologyThumbnailInterface/);
  assert.match(source, /function readThemeIcon/);
  assert.match(source, /accept="image\/png,image\/jpeg"/);
  assert.match(source, /theme-edit-preview/);
});

test("theme space editing validates required fields and uses a single picture upload", () => {
  const source = readFileSync(new URL("../src/views/ThemeSpaceManagement/index.vue", import.meta.url), "utf8");
  assert.match(source, /:error="editApiNameError"/);
  assert.match(source, /:error="editDisplayNameError"/);
  assert.match(source, /请输入 API 名称/);
  assert.match(source, /请输入空间名称/);
  assert.match(source, /v-if="!editDraft\.iconUrl"/);
  assert.match(source, /:limit="1"/);
  assert.match(source, /:on-exceed="handleThemeIconExceed"/);
  assert.match(source, /el-upload--picture-card/);
});

test("theme space toolbar uses theme space description", () => {
  const pageSource = readFileSync(new URL("../src/views/ThemeSpaceManagement/index.vue", import.meta.url), "utf8");
  const toolbarSource = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SectionToolbar.vue", import.meta.url), "utf8");
  assert.match(pageSource, /space-label="主题空间"/);
  assert.match(toolbarSource, /spaceLabel\?: string/);
  assert.match(toolbarSource, /全部\$\{props\.spaceLabel\}/);
});

test("theme space object statistic reuses the object card color", () => {
  const source = readFileSync(new URL("../src/views/ThemeSpaceManagement/index.vue", import.meta.url), "utf8");
  assert.match(source, /\{ id: "object", label: "对象", value: overviewCount\.value\.ontologyCount/);
});

test("theme space light theme uses light backgrounds for list and creation panels", () => {
  const themeSource = readFileSync(new URL("../src/views/ThemeSpaceManagement/index.vue", import.meta.url), "utf8");
  const treeSource = readFileSync(new URL("../src/views/OntologySubspaceCreate/components/SubspaceCreateTreePanel.vue", import.meta.url), "utf8");
  const workspaceSource = readFileSync(new URL("../src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue", import.meta.url), "utf8");
  assert.match(themeSource, /:root:not\(\.dark\) \.theme-space-management__grid/);
  assert.match(themeSource, /:root:not\(\.dark\) \.theme-space-card/);
  assert.match(treeSource, /:root:not\(\.dark\) \.subspace-create-tree-panel/);
  assert.match(workspaceSource, /:root:not\(\.dark\) \.subspace-create-workspace__panel/);
});

test("space actions expose conceptual model build with current space context", () => {
  const actionsSource = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SpaceActions.vue", import.meta.url), "utf8");
  const composableSource = readFileSync(new URL("../src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts", import.meta.url), "utf8");
  assert.match(actionsSource, /command="conceptual-model"/);
  assert.match(actionsSource, /v-if="canBuildConceptualModel"/);
  assert.match(actionsSource, /metrics\.ontology === 0/);
  assert.match(actionsSource, /value === "conceptual-model"/);
  assert.match(composableSource, /action === "conceptual-model"/);
  assert.match(composableSource, /name: "OntologyConceptualModelCreate"/);
  assert.match(composableSource, /spaceId: space\.id/);
  assert.match(composableSource, /spaceName: space\.displayName/);
  assert.match(composableSource, /spaceApiName: space\.apiName/);
});

test("conceptual model canvas displays route space context as readonly fields", () => {
  const source = readFileSync(new URL("../src/views/OntologyConceptualModelCreate/index.vue", import.meta.url), "utf8");
  assert.match(source, /useRoute/);
  assert.match(source, /route\.query\.spaceName/);
  assert.match(source, /route\.query\.spaceApiName/);
  assert.match(source, /:readonly="hasRouteSpaceContext"/);
  assert.match(source, /hasRouteSpaceContext = computed/);
});

test("embedded object space management hides the create space button", () => {
  const pageSource = readFileSync(new URL("../src/views/OntologySpaceManagement/index.vue", import.meta.url), "utf8");
  const welcomeSource = readFileSync(new URL("../src/views/OntologySpaceManagement/components/WelcomePanel.vue", import.meta.url), "utf8");
  assert.match(pageSource, /useRoute/);
  assert.match(pageSource, /route\.query\.userName/);
  assert.match(pageSource, /:show-create="!isEmbedded"/);
  assert.match(welcomeSource, /v-if="showCreate"/);
  assert.match(welcomeSource, /withDefaults\(defineProps/);
});

test("space form validates required fields before emitting save", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SpaceFormDialog.vue", import.meta.url), "utf8");
  assert.match(source, /:error="apiNameError"/);
  assert.match(source, /:error="displayNameError"/);
  assert.match(source, /const apiNameError = ref\(\"\"\)/);
  assert.match(source, /const displayNameError = ref\(\"\"\)/);
  assert.match(source, /请输入 API 名称/);
  assert.match(source, /请输入空间名称/);
  assert.match(source, /API 名称格式不正确/);
  assert.match(source, /emit\("save", \{ \.\.\.draft \}\)/);
});

test("space form limits icon upload to one image and hides the add card after preview", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SpaceFormDialog.vue", import.meta.url), "utf8");
  assert.match(source, /v-if="!draft\.iconUrl"/);
  assert.match(source, /:limit="1"/);
  assert.match(source, /:on-exceed="handleIconExceed"/);
  assert.match(source, /仅支持上传一张图片/);
  assert.match(source, /el-upload--picture-card/);
});
