import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createMemoryHistory, createRouter } from "vue-router";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";
import { createOntologySpaceRelationWorkspaceData } from "../src/mocks/ontologySpaceRelationMock/ontologySpaceRelationMock.ts";
import { filterRelationsByHop, filterRelationsBySourceObject } from "../src/views/OntologySpaceManagementDetail/utils/spaceRelationGraph.ts";
import {
  addRelation,
  addRelationCategory,
  filterRelationsByCategory,
  removeRelation,
  removeRelationCategory,
} from "../src/views/OntologySpaceManagementDetail/utils/relationOperations.ts";
import { ROOT_RELATION_CATEGORY_ID } from "../src/types/pages/ontologySpaceRelationType.ts";

test("relation child route points to the space relation workspace component", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "OntologySpaceManagementDetailRelation", params: { spaceId: "army" } });
  assert.equal(route.path, "/workspace/ontology-space-management/army/relation");
  const source = readFileSync(new URL("../src/router/modules/workspaceRoutes.ts", import.meta.url), "utf8");
  assert.match(source, /SpaceRelationWorkspace\.vue/);
});

test("hop filter keeps only adjacent layers from the seed", () => {
  const data = createOntologySpaceRelationWorkspaceData();
  const filtered = filterRelationsByHop(data.relations, ["福特级航空母舰(CVN)"], 1);
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((item) => item.sourceName === "福特级航空母舰(CVN)" || item.targetName === "福特级航空母舰(CVN)"));
});

test("source object filter keeps relations whose source matches value or label", () => {
  const data = createOntologySpaceRelationWorkspaceData();
  const byLabel = filterRelationsBySourceObject(data.relations, "福特级航空母舰(CVN)");
  assert.ok(byLabel.length > 0);
  assert.ok(byLabel.every((item) => item.sourceName === "福特级航空母舰(CVN)"));

  const options = [{ value: "uid-ford", label: "福特级航空母舰(CVN)" }];
  const byValue = filterRelationsBySourceObject(data.relations, "uid-ford", options);
  assert.deepEqual(byValue.map((item) => item.id).sort(), byLabel.map((item) => item.id).sort());

  const workspaceSource = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/composables/useSpaceRelationWorkspace.ts", import.meta.url), "utf8");
  assert.match(workspaceSource, /filterRelationsBySourceObject/);
  assert.doesNotMatch(workspaceSource, /filterRelationsByHop\(/);
});

test("category filter includes nested category relations", () => {
  const data = createOntologySpaceRelationWorkspaceData();
  const filtered = filterRelationsByCategory(data.relations, data.categoryTree, "rel-combat");
  assert.ok(filtered.some((item) => item.categoryId === "rel-combat-command"));
  assert.ok(filtered.some((item) => item.categoryId === "rel-combat-support"));
});

test("relation 3d graph does not load entity svg node icons", () => {
  const graphSource = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/composables/useRelationGraph3d.ts", import.meta.url), "utf8");
  const textureSource = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/utils/relationGraph3dTexture.ts", import.meta.url), "utf8");
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
  const mapperUrl = new URL("../src/views/OntologySpaceManagementDetail/utils/mapOntologyObjectsToRelationOptions.ts", import.meta.url);
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
  const workspaceSource = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/composables/useSpaceRelationWorkspace.ts", import.meta.url), "utf8");
  const formSource = readFileSync(
    new URL("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationFormDialog.vue", import.meta.url),
    "utf8",
  );
  assert.match(workspaceSource, /getOntologyCategoryTreeInterface/);
  assert.match(workspaceSource, /mapOntologyObjectsToRelationOptions/);
  assert.doesNotMatch(formSource, /allow-create/);
  assert.match(formSource, /源本体与目标本体不能相同/);
  assert.match(formSource, /请选择源本体对象/);
  assert.match(formSource, /请选择目标本体对象/);
});

test("relation form create only prefills categoryId when default is in category options", () => {
  const formSource = readFileSync(
    new URL("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationFormDialog.vue", import.meta.url),
    "utf8",
  );
  assert.match(formSource, /findRelationCategoryNode\(props\.categoryOptions,\s*props\.defaultCategoryId\)/);
  assert.doesNotMatch(formSource, /defaultCategoryId\s*&&\s*props\.defaultCategoryId\s*!==\s*ROOT_RELATION_CATEGORY_ID/);
  assert.match(formSource, /placeholder="请选择关系分类"/);
});

test("relation form category options expose the full tree including the root node", () => {
  const workspaceSource = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/composables/useSpaceRelationWorkspace.ts", import.meta.url), "utf8");
  assert.match(workspaceSource, /relationCategoryOptions\s*=\s*computed\(\s*\(\)\s*=>\s*relationCategoryTree\.value\s*\)/);
  assert.doesNotMatch(workspaceSource, /relationCategoryOptions\s*=\s*computed\(\s*\(\)\s*=>\s*relationCategoryTree\.value\[0\]\?\.children/);
});

test("relation form disables api name when editing", () => {
  const formSource = readFileSync(
    new URL("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationFormDialog.vue", import.meta.url),
    "utf8",
  );
  assert.match(formSource, /placeholder="请输入 API 名称"\s*:disabled="mode === 'edit'"/);
  assert.match(formSource, /:clearable="mode !== 'edit'"/);
  assert.match(formSource, /placeholder="请选择源本体对象"[\s\S]*?:disabled="mode === 'edit'"/);
  assert.match(formSource, /placeholder="请选择目标本体对象"[\s\S]*?:disabled="mode === 'edit'"/);
});

test("relation form category is optional and create submit does not require categoryId", () => {
  const formSource = readFileSync(
    new URL("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationFormDialog.vue", import.meta.url),
    "utf8",
  );
  const pageTypeSource = readFileSync(new URL("../src/types/pages/ontologySpaceRelationType.ts", import.meta.url), "utf8");
  assert.match(formSource, /<el-form-item v-if="categoryOptions\.length" label="分类"/);
  assert.doesNotMatch(formSource, /!categoryId\.value/);
  assert.match(pageTypeSource, /categoryId\?:\s*string/);
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
  assert.match(source, /name:\s*"OntologyObjectDetailRelation"[\s\S]*SpaceRelationWorkspace\.vue/);
});

test("relation route context resolves space id and object filter seed", async () => {
  const helperUrl = new URL("../src/views/OntologySpaceManagementDetail/utils/resolveRelationRouteContext.ts", import.meta.url);
  assert.equal(existsSync(helperUrl), true);
  const { resolveRelationSpaceId, resolveObjectRelationFilterSeed } = await import(helperUrl.href);
  assert.equal(resolveRelationSpaceId({ params: { spaceId: "12" }, query: {} }), "12");
  assert.equal(resolveRelationSpaceId({ params: {}, query: { spaceId: "46" } }), "46");
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
