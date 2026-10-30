import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createMemoryHistory, createRouter } from "vue-router";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";
import { createOntologySpaceRelationWorkspaceData } from "../src/mocks/ontologySpaceRelationMock/ontologySpaceRelationMock.ts";
import { computeHopDistances, filterRelationsByHop } from "../src/views/SpaceRelationWorkspace/utils/spaceRelationGraph.ts";
import {
  addRelation,
  addRelationCategory,
  filterRelationsByCategory,
  pruneRelationCategoryTree,
  removeRelation,
  removeRelationCategory,
} from "../src/views/SpaceRelationWorkspace/utils/relationOperations.ts";
import { ROOT_RELATION_CATEGORY_ID } from "../src/types/pages/ontologySpaceRelationType.ts";

test("relation child route points to the space relation workspace component", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "OntologySpaceManagementDetailRelation", params: { spaceId: "army" } });
  assert.equal(route.path, "/workspace/ontology-space-management/army/relation");
  const source = readFileSync(new URL("../src/router/modules/workspaceRoutes.ts", import.meta.url), "utf8");
  assert.match(source, /SpaceRelationWorkspace\/index\.vue/);
});

test("relation tree node click opens the read-only detail dialog instead of the edit dialog", () => {
  const workspaceSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/index.vue", import.meta.url), "utf8");
  const detailDialogSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/RelationDetailDialog.vue", import.meta.url), "utf8");

  assert.match(workspaceSource, /RelationDetailDialog/);
  assert.match(workspaceSource, /relationDetailVisible/);
  assert.match(workspaceSource, /function openRelationFromTree\(relationId: string\) \{[\s\S]*?relationDetailVisible\.value = true;/);
  assert.doesNotMatch(workspaceSource, /function openRelationFromTree\(relationId: string\) \{[\s\S]*?openRelationEdit\(item\)/);
  assert.match(detailDialogSource, /title="关系详情"/);
  assert.match(detailDialogSource, /el-descriptions/);
  assert.match(detailDialogSource, /relation: OntologyRelationClass \| null/);
});

test("hop filter keeps only adjacent layers from the seed", () => {
  const data = createOntologySpaceRelationWorkspaceData();
  const filtered = filterRelationsByHop(data.relations, ["福特级航空母舰(CVN)"], 1);
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((item) => item.sourceName === "福特级航空母舰(CVN)" || item.targetName === "福特级航空母舰(CVN)"));
});

test("hop distances and hop filter tolerate blank seeds and endpoints", () => {
  const data = createOntologySpaceRelationWorkspaceData();
  assert.equal(computeHopDistances(data.relations, ["", "   "]).size, 0);
  assert.equal(filterRelationsByHop(data.relations, ["  "], 2).length, data.relations.length);

  const withBlankSource = [
    ...data.relations,
    { ...data.relations[0], id: "rel-blank-source", sourceName: "  ", targetName: "孤立对象" },
  ];
  const hop = computeHopDistances(withBlankSource, ["孤立对象"]);
  assert.equal(hop.get("孤立对象"), 0);
});

test("hop filter expands one more layer at two hops", () => {
  const data = createOntologySpaceRelationWorkspaceData();
  const oneHop = filterRelationsByHop(data.relations, ["福特级航空母舰(CVN)"], 1);
  const twoHops = filterRelationsByHop(data.relations, ["福特级航空母舰(CVN)"], 2);
  const oneHopIds = new Set(oneHop.map((item) => item.id));
  const twoHopIds = new Set(twoHops.map((item) => item.id));

  assert.ok(oneHopIds.has("rel-burke-escorts-ford"));
  assert.ok(oneHopIds.has("rel-cruiser-escorts-ford"));
  [
    "rel-airwing-fighter",
    "rel-destroyer-submarine-escort",
    "rel-base-shipyard",
    "rel-jtf-patrol-aircraft",
    "rel-amphibious-carries-marine",
  ].forEach((id) => {
    assert.ok(twoHopIds.has(id), `expected ${id} in two-hop result`);
  });
  ["rel-shipyard-repair-center", "rel-fighter-squadron", "rel-burke-aa-coord", "rel-burke-replenished", "rel-burke-homeported"].forEach((id) => {
    assert.equal(twoHopIds.has(id), false, `unexpected ${id} in two-hop result`);
  });
  oneHopIds.forEach((id) => {
    assert.ok(twoHopIds.has(id), `expected ${id} kept at two hops`);
  });
});

test("relation workspace filters by undirected hop and exposes hop switch", () => {
  const workspaceSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/composables/useSpaceRelationWorkspace.ts", import.meta.url), "utf8");
  assert.match(workspaceSource, /maxHop: 1,/);
  assert.match(workspaceSource, /filterRelationsByHop\(byCategory, graphSeedNames\.value, relationFilter\.value\.maxHop\)/);
  assert.match(workspaceSource, /function setRelationFilterMaxHop\(hop: SpaceRelationHopLevel\)/);
  assert.match(workspaceSource, /setRelationFilterMaxHop,/);
  assert.match(workspaceSource, /maxHop: relationFilter\.value\.maxHop,/);
  assert.doesNotMatch(workspaceSource, /filterRelationsBySourceObject/);
  assert.doesNotMatch(workspaceSource, /params\.ontologyUniqueIdentifierFrom/);
  assert.match(workspaceSource, /loadSpaceRelationWorkspaceFromApi\(spaceId: string\)/);
  assert.match(workspaceSource, /loadSpaceRelationWorkspaceFromApi\(spaceId\.value\)/);
});

test("relation workspace header offers one and two hop switch", () => {
  const pageSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/index.vue", import.meta.url), "utf8");
  assert.match(pageSource, /ariaLabel="关系跳数"/);
  assert.match(pageSource, /:model-value="relationFilter\.maxHop"/);
  assert.match(pageSource, /<el-radio-group[\s\S]*?v-if="relationFilter\.applied"/);
  assert.match(pageSource, /<el-radio-button :value="1">1跳<\/el-radio-button>/);
  assert.match(pageSource, /<el-radio-button :value="2">2跳<\/el-radio-button>/);
  assert.match(pageSource, /function handleMaxHopChange/);
  assert.match(pageSource, /function resetFilter\(\) \{[\s\S]*?setRelationFilterMaxHop\(1\);/);
});

test("object relation page scopes the category panel to hop-filtered relations and pruned tree", () => {
  const workspaceSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/composables/useSpaceRelationWorkspace.ts", import.meta.url), "utf8");
  const pageSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/index.vue", import.meta.url), "utf8");
  const operationsSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/utils/relationOperations.ts", import.meta.url), "utf8");

  assert.match(operationsSource, /export function pruneRelationCategoryTree\(/);
  assert.match(workspaceSource, /const categoryPanelRelations = computed/);
  assert.match(workspaceSource, /isObjectRelationPage\.value && relationFilter\.value\.applied/);
  assert.match(workspaceSource, /filterRelationsByHop\(relations\.value, graphSeedNames\.value, relationFilter\.value\.maxHop\)/);
  assert.match(workspaceSource, /const categoryPanelTreeData = computed/);
  assert.match(workspaceSource, /pruneRelationCategoryTree\(relationCategoryTree\.value, categoryPanelRelations\.value\)/);
  assert.match(workspaceSource, /categoryPanelRelations,/);
  assert.match(workspaceSource, /categoryPanelTreeData,/);
  assert.match(pageSource, /:tree-data="categoryPanelTreeData"/);
  assert.match(pageSource, /:relations="categoryPanelRelations"/);
});

test("category filter includes nested category relations", () => {
  const data = createOntologySpaceRelationWorkspaceData();
  const filtered = filterRelationsByCategory(data.relations, data.categoryTree, "rel-combat");
  assert.ok(filtered.some((item) => item.categoryId === "rel-combat-command"));
  assert.ok(filtered.some((item) => item.categoryId === "rel-combat-support"));
});

test("relation category tree pruning keeps only branches containing matched relations", () => {
  const data = createOntologySpaceRelationWorkspaceData();
  const target = data.relations[0];

  const findPath = (nodes, categoryId, trail = []) => {
    for (const node of nodes) {
      const next = [...trail, node.id];
      if (node.id === categoryId) return next;
      const found = findPath(node.children ?? [], categoryId, next);
      if (found) return found;
    }
    return null;
  };
  const path = findPath(data.categoryTree, target.categoryId);
  assert.ok(path, "expected the target category to exist in the mock tree");

  const pruned = pruneRelationCategoryTree(data.categoryTree, [target]);
  const keptIds = [];
  const walk = (nodes) =>
    nodes.forEach((node) => {
      keptIds.push(node.id);
      walk(node.children ?? []);
    });
  walk(pruned);

  assert.deepEqual([...new Set(keptIds)].sort(), [...new Set(path)].sort());
  assert.ok(pruned.length > 0);
});

test("relation 3d graph does not load entity svg node icons", () => {
  const graphSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/composables/useRelationGraph3d.ts", import.meta.url), "utf8");
  const textureSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/utils/relationGraph3dTexture.ts", import.meta.url), "utf8");
  assert.doesNotMatch(graphSource, /resolveRelationObjectIcon|relationObjectIcon|createRelationNodeTexture/);
  assert.doesNotMatch(textureSource, /createRelationNodeTexture/);
  assert.equal(existsSync(new URL("../src/views/OntologySpaceManagementDetail/utils/relationObjectIcon.ts", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/assets/pages/ontologySpaceManagementDetail/entities", import.meta.url)), false);
});

test("relation mock CRUD creates and removes categories and relations", () => {
  let data = createOntologySpaceRelationWorkspaceData();
  data = addRelationCategory(data, { parentId: ROOT_RELATION_CATEGORY_ID, name: "临时分类" });
  const created = data.categoryTree[0]?.children.find((item) => item.label === "临时分类");
  assert.ok(created);
  data = addRelation(data, {
    categoryId: created.id,
    displayName: "临时关系",
    apiName: "temp_relation_api",
    sourceName: "对象A",
    targetName: "对象B",
    cardinality: "一对一",
    description: "测试",
  });
  assert.ok(data.relations.some((item) => item.apiName === "temp_relation_api"));
  const relationId = data.relations.find((item) => item.apiName === "temp_relation_api")?.id || "";
  data = removeRelation(data, relationId);
  data = removeRelationCategory(data, created.id);
  assert.equal(
    data.categoryTree[0]?.children.some((item) => item.id === created.id),
    false,
  );
});

test("relation object options mapper collects ontology meta display names from the object tree", async () => {
  const mapperUrl = new URL("../src/utils/mapOntologyObjectsToRelationOptions.ts", import.meta.url);
  assert.equal(existsSync(mapperUrl), true, "missing mapper file");
  const { mapOntologyObjectsToRelationOptions } = await import(mapperUrl.href);
  const options = mapOntologyObjectsToRelationOptions({
    categoryId: 1,
    name: "平台",
    ontologyMetaInfos: [{ displayName: "舰船1", uniqueIdentifier: "id-a" }],
    children: [
      {
        categoryId: 2,
        name: "舰船分类",
        ontologyMetaInfos: [
          { displayName: "飞机", uniqueIdentifier: "id-b" },
          { displayName: "舰船1", uniqueIdentifier: "id-c" },
        ],
      },
    ],
  });
  assert.deepEqual(
    options.map((item) => ({ value: item.value, label: item.label })),
    [
      { value: "id-b", label: "飞机" },
      { value: "id-a", label: "舰船1" },
      { value: "id-c", label: "舰船1" },
    ].sort((a, b) => a.label.localeCompare(b.label, "zh-CN") || a.value.localeCompare(b.value)),
  );
});

test("relation workspace loads object options from the object category tree api", () => {
  const workspaceSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/composables/useSpaceRelationWorkspace.ts", import.meta.url), "utf8");
  const pageSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/index.vue", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/SpaceRelationFormDialog.vue", import.meta.url), "utf8");
  assert.match(workspaceSource, /getOntologyCategoryTreeInterface/);
  assert.match(workspaceSource, /mapOntologyObjectsToRelationOptions/);
  assert.match(workspaceSource, /isObjectRelationPage/);
  assert.match(pageSource, /v-if="!isObjectRelationPage"/);
  assert.match(pageSource, /筛选对象（单选，结果以该对象为中心）/);
  assert.match(pageSource, /:object-options="relationObjectOptions"/);
  assert.doesNotMatch(formSource, /allow-create/);
  assert.match(formSource, /源对象与目标对象不能相同/);
  assert.match(formSource, /请选择源对象/);
  assert.match(formSource, /请选择目标对象/);
});

test("relation form create only prefills categoryId when default is in category options", () => {
  const formSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/SpaceRelationFormDialog.vue", import.meta.url), "utf8");
  assert.match(formSource, /findRelationCategoryNode\(props\.categoryOptions,\s*props\.defaultCategoryId\)/);
  assert.doesNotMatch(formSource, /defaultCategoryId\s*&&\s*props\.defaultCategoryId\s*!==\s*ROOT_RELATION_CATEGORY_ID/);
  assert.match(formSource, /placeholder="请选择关系分类"/);
});

test("relation form category options expose the full tree including the root node", () => {
  const workspaceSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/composables/useSpaceRelationWorkspace.ts", import.meta.url), "utf8");
  assert.match(workspaceSource, /relationCategoryOptions\s*=\s*computed\(\s*\(\)\s*=>\s*relationCategoryTree\.value\s*\)/);
  assert.doesNotMatch(workspaceSource, /relationCategoryOptions\s*=\s*computed\(\s*\(\)\s*=>\s*relationCategoryTree\.value\[0\]\?\.children/);
});

test("relation form disables api name when editing", () => {
  const formSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/SpaceRelationFormDialog.vue", import.meta.url), "utf8");
  assert.match(formSource, /placeholder="请输入 API 名称"\s*:disabled="mode === 'edit'"/);
  assert.match(formSource, /placeholder="请选择源对象"[\s\S]*?:disabled="mode === 'edit'"/);
  assert.match(formSource, /placeholder="请选择目标对象"[\s\S]*?:disabled="mode === 'edit'"/);
});

test("relation form category is required for create and edit", () => {
  const formSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/SpaceRelationFormDialog.vue", import.meta.url), "utf8");
  assert.match(formSource, /<el-form-item v-if="categoryOptions\.length" label="分类" required>/);
  assert.match(formSource, /categoryOptions\.length && !trimmedCategoryId/);
  assert.match(formSource, /请选择关系分类/);
  assert.doesNotMatch(formSource, /:clearable="mode !== 'edit'"/);
});

test("clicking a relation leaf in the category tree opens the relation editor", () => {
  const panelSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/RelationCategoryPanel.vue", import.meta.url), "utf8");
  const workspaceSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/index.vue", import.meta.url), "utf8");

  assert.match(panelSource, /"edit-relation": \[relationId: string\]/);
  assert.match(panelSource, /relationId: item\.id/);
  assert.match(panelSource, /function handleNodeClick/);
  assert.match(panelSource, /emit\("edit-relation", data\.relationId\)/);
  assert.match(panelSource, /emit\("select-node", data\.id\)/);
  assert.doesNotMatch(panelSource, /emit\("select-node", data\.categoryId\)/);
  assert.match(workspaceSource, /@edit-relation="openRelationFromTree"/);
  assert.match(workspaceSource, /function openRelationFromTree/);
  assert.match(workspaceSource, /openRelationEdit\(/);
});

test("object detail relation route reuses the space relation workspace component", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({
    name: "OntologyObjectDetailRelation",
    params: { objectId: "obj-1" },
    query: { spaceId: "46", objectName: "飞机" },
  });
  assert.equal(route.path, "/workspace/ontology-object/obj-1/relation");
  const source = readFileSync(new URL("../src/router/modules/workspaceRoutes.ts", import.meta.url), "utf8");
  assert.match(source, /name:\s*"OntologyObjectDetailRelation"[\s\S]*SpaceRelationWorkspace\/index\.vue/);
});

test("relation route context resolves space id and object filter seed", async () => {
  const helperUrl = new URL("../src/views/SpaceRelationWorkspace/utils/resolveRelationRouteContext.ts", import.meta.url);
  assert.equal(existsSync(helperUrl), true);
  const { resolveRelationSpaceId, resolveObjectRelationFilterSeed, resolveRelationOntologyUniqueIdentifierFrom } = await import(helperUrl.href);
  assert.equal(resolveRelationSpaceId({ params: { spaceId: "12" }, query: {} }), "12");
  assert.equal(resolveRelationSpaceId({ params: {}, query: { spaceId: "46" } }), "46");
  assert.equal(resolveRelationOntologyUniqueIdentifierFrom({ params: { objectId: "uid-plane" }, query: { spaceId: "46" } }), "uid-plane");
  assert.equal(resolveRelationOntologyUniqueIdentifierFrom({ params: { spaceId: "12" }, query: {} }), "");
  assert.equal(
    resolveObjectRelationFilterSeed({ params: { objectId: "uid-plane" }, query: { objectName: "飞机" } }, [{ value: "uid-plane", label: "飞机" }]),
    "uid-plane",
  );
  assert.equal(
    resolveObjectRelationFilterSeed({ params: { objectId: "missing" }, query: { objectName: "飞机" } }, [{ value: "uid-plane", label: "飞机" }]),
    "uid-plane",
  );
  assert.equal(resolveObjectRelationFilterSeed({ params: {}, query: { objectName: "飞机" } }, []), "");
});

test("space and object relation pages use the prototype panel and graph backgrounds", () => {
  const workspace = readFileSync(new URL("../src/views/SpaceRelationWorkspace/index.vue", import.meta.url), "utf8");
  const categoryPanel = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/RelationCategoryPanel.vue", import.meta.url), "utf8");
  const graph = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/RelationGraphView.vue", import.meta.url), "utf8");
  const panelGradient = /linear-gradient\(135deg, var\(--aircas-color-panel-background\), var\(--aircas-color-panel-background-deep\)\)/;

  assert.match(categoryPanel, panelGradient);
  assert.match(categoryPanel, /box-shadow: inset 0 0 20px var\(--aircas-color-effect-page-glow\)/);
  assert.match(categoryPanel, /<el-tree/);
  assert.match(workspace, panelGradient);
  assert.match(workspace, /box-shadow: inset 0 0 18px var\(--aircas-color-effect-page-glow\)/);
  assert.match(workspace, /<el-radio-group/);
  assert.match(workspace, /\.space-relation-workspace__filter[\s\S]*display: flex/);
  const actions = workspace.match(/class="space-relation-workspace__actions"[\s\S]*?<\/header>/)?.[0] ?? "";
  assert.match(actions, /space-relation-workspace__filter[\s\S]*添加[\s\S]*space-relation-workspace__view-switch/);
  assert.match(graph, /radial-gradient\([\s\S]*var\(--aircas-color-effect-primary-fill\)/);
  assert.match(graph, /\.relation-graph-view--holographic[\s\S]*background: var\(--aircas-color-page-background\)/);
  assert.match(graph, /color-mix\(in srgb, var\(--aircas-color-black\) 72%, transparent\)/);
});

test("relation module buttons use the space management theme tones", () => {
  const workspace = readFileSync(new URL("../src/views/SpaceRelationWorkspace/index.vue", import.meta.url), "utf8");
  const categoryPanel = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/RelationCategoryPanel.vue", import.meta.url), "utf8");
  const relationForm = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/SpaceRelationFormDialog.vue", import.meta.url), "utf8");
  const categoryForm = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/RelationCategoryFormDialog.vue", import.meta.url), "utf8");
  const relationDelete = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/RelationDeleteDialog.vue", import.meta.url), "utf8");
  const categoryDelete = readFileSync(new URL("../src/views/SpaceRelationWorkspace/components/RelationCategoryDeleteDialog.vue", import.meta.url), "utf8");

  assert.match(workspace, /<el-button[\s\S]*添加/);
  assert.match(workspace, /<el-button[\s\S]*重置/);
  assert.match(workspace, /<el-button[\s\S]*重试/);
  assert.match(categoryPanel, /<el-button[\s\S]*添加关系分类/);
  assert.match(categoryPanel, /action--add[\s\S]*linear-gradient\(90deg, var\(--aircas-color-active\), var\(--aircas-color-effect-blue-fill\)\)/);
  assert.match(categoryPanel, /action--edit[\s\S]*background: var\(--aircas-color-effect-blue-soft\)/);
  assert.match(categoryPanel, /action--danger[\s\S]*background: var\(--aircas-color-effect-danger-fill\)/);
  assert.match(relationForm, /<el-button[\s\S]*取消/);
  assert.match(relationForm, /<el-button[\s\S]*确认/);
  assert.match(categoryForm, /<el-button[\s\S]*取消/);
  assert.match(categoryForm, /<el-button[\s\S]*确认/);
  assert.match(relationDelete, /<el-button[\s\S]*取消/);
  assert.match(relationDelete, /<el-button[\s\S]*确认删除/);
  assert.match(categoryDelete, /<el-button[\s\S]*取消/);
  assert.match(categoryDelete, /<el-button[\s\S]*确认删除/);
});
