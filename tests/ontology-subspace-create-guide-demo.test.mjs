import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  GUIDE_ONTOLOGY_CATEGORY_TREE_DATA,
  GUIDE_SUBSPACE_CREATE_OBJECT_IDS,
  queryGuideOntologyEntities,
  queryGuideOntologyProperties,
  queryGuideOntologyRelationTree,
} from "../src/mocks/ontologySubspaceCreateGuideMock/ontologySubspaceCreateGuideMock.ts";
import { mapOntologyCategorySections, mapOntologyCategoryTree } from "../src/views/ObjectWorkspacePanel/utils/mapOntologyCategoryTree.ts";
import { mapSubspaceCreateSelectedInstances } from "../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedInstance.ts";
import {
  listSubspaceCreateObjectsMissingProperties,
  mapSubspaceCreateObjectPropertyGroup,
} from "../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateObjectProperty.ts";
import { mapSubspaceCreateRelationsFromTree } from "../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedRelation.ts";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

/**
 * @description 收集分类树中挂载的全部对象唯一标识。
 * @param nodes 概念层级树节点。
 * @returns 对象唯一标识数组。
 */
const collectTreeObjectIds = (nodes) =>
  nodes.flatMap((node) => [...(node.objects ?? []).map((object) => object.uniqueIdentifier), ...collectTreeObjectIds(node.children)]);

test("演示分类树映射后包含全部成套演示对象", () => {
  const tree = mapOntologyCategoryTree(GUIDE_ONTOLOGY_CATEGORY_TREE_DATA);
  const ids = collectTreeObjectIds(tree);
  assert.deepEqual([...ids].sort(), [...GUIDE_SUBSPACE_CREATE_OBJECT_IDS].sort());
});

test("演示分类树可映射出带 apiName 的对象分区", () => {
  const sections = mapOntologyCategorySections(GUIDE_ONTOLOGY_CATEGORY_TREE_DATA);
  const items = sections.flatMap((section) => section.items);
  assert.equal(items.length, GUIDE_SUBSPACE_CREATE_OBJECT_IDS.length);
  assert.ok(items.every((item) => item.apiName.trim().length > 0));
});

test("演示实例查询按页码与页大小分页且总数稳定", () => {
  const firstPage = queryGuideOntologyEntities({ ontologyUniqueIdentifier: GUIDE_SUBSPACE_CREATE_OBJECT_IDS[0], pageNum: 1, pageSize: 10 });
  assert.equal(firstPage.code, 200);
  assert.equal(firstPage.data.records.length, 10);
  assert.equal(firstPage.data.total, 12);
  const secondPage = queryGuideOntologyEntities({ ontologyUniqueIdentifier: GUIDE_SUBSPACE_CREATE_OBJECT_IDS[0], pageNum: 2, pageSize: 10 });
  assert.equal(secondPage.data.records.length, 2);
  assert.equal(secondPage.data.current, 2);
});

test("演示实例记录可映射为带名称的实例行", () => {
  const response = queryGuideOntologyEntities({ ontologyUniqueIdentifier: GUIDE_SUBSPACE_CREATE_OBJECT_IDS[1], pageNum: 1, pageSize: 10 });
  const object = { id: GUIDE_SUBSPACE_CREATE_OBJECT_IDS[1], label: "航空母舰", apiName: GUIDE_SUBSPACE_CREATE_OBJECT_IDS[1] };
  const instances = mapSubspaceCreateSelectedInstances(response.data.records, object);
  assert.equal(instances.length, 10);
  assert.ok(instances.every((instance) => instance.id.trim().length > 0 && instance.name.trim().length > 0));
});

test("演示属性查询为每个对象返回含主键的非空属性", () => {
  const groups = GUIDE_SUBSPACE_CREATE_OBJECT_IDS.map((objectId) => {
    const response = queryGuideOntologyProperties({ ontologyUniqueIdentifier: objectId });
    assert.equal(response.code, 200);
    assert.ok(response.data.length > 0, `对象 ${objectId} 缺少演示属性`);
    assert.ok(
      response.data.some((property) => property.isPrimaryKey === true),
      `对象 ${objectId} 缺少主键属性`,
    );
    return mapSubspaceCreateObjectPropertyGroup(response.data, { id: objectId, label: objectId, apiName: objectId });
  });
  const selectedIds = groups.flatMap((group) => group.properties.map((property) => property.id));
  assert.deepEqual(listSubspaceCreateObjectsMissingProperties(groups, selectedIds), []);
});

test("演示关系查询的端点均落在演示对象集合内并可映射为关系行", () => {
  const objectIds = new Set(GUIDE_SUBSPACE_CREATE_OBJECT_IDS);
  for (const objectId of GUIDE_SUBSPACE_CREATE_OBJECT_IDS) {
    const response = queryGuideOntologyRelationTree({ spaceId: "guide-space", ontologyUniqueIdentifierFrom: objectId });
    assert.equal(response.code, 200);
    const links = collectRelationLinks(response.data);
    assert.ok(links.length > 0, `对象 ${objectId} 缺少演示关系`);
    for (const link of links) {
      assert.equal(objectIds.has(link.ontologyUniqueIdentifierFrom), true);
      assert.equal(objectIds.has(link.ontologyUniqueIdentifierTo), true);
    }
  }
});

test("演示关系树可在已选对象下映射出关系行", () => {
  const objects = GUIDE_SUBSPACE_CREATE_OBJECT_IDS.map((id) => ({ id, label: id, apiName: id }));
  const rows = GUIDE_SUBSPACE_CREATE_OBJECT_IDS.flatMap((objectId) =>
    mapSubspaceCreateRelationsFromTree(queryGuideOntologyRelationTree({ spaceId: "guide-space", ontologyUniqueIdentifierFrom: objectId }).data, objects),
  );
  const uniqueRows = new Map(rows.map((row) => [row.id, row]));
  assert.ok(uniqueRows.size > 0);
  assert.ok([...uniqueRows.values()].every((row) => row.sourceLabel.trim().length > 0 && row.targetLabel.trim().length > 0));
});

test("演示数据不依赖当前时间与随机数", () => {
  const source = readSource("../src/mocks/ontologySubspaceCreateGuideMock/ontologySubspaceCreateGuideMock.ts");
  assert.equal(/Date\.now|Math\.random/.test(source), false);
});

test("创建主题页在演示模式下跳过真实创建接口并回到主题管理页，且保留引导续接", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/index.vue");
  assert.match(source, /isGuideDemoMode/);
  assert.match(source, /route\.query\.guide === "1"/);
  assert.match(source, /router\.replace\(\{\s*name: "ThemeSpaceManagement"/);
  const createFunction = source.slice(source.indexOf("async function createSubspace()"));
  const demoBranchIndex = createFunction.indexOf("引导演示已完成");
  assert.notEqual(demoBranchIndex, -1);
  const demoBranch = createFunction.slice(demoBranchIndex, createFunction.indexOf("return;", demoBranchIndex));
  assert.equal(demoBranch.includes("createOntologySubspaceInterface"), false);
  assert.equal(demoBranch.includes("guideVisible.value = false"), false);
  assert.ok(createFunction.indexOf("createOntologySubspaceInterface") > demoBranchIndex);
});

test("演示模式下引导切到其他页面步骤时回到主题管理页续接", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/index.vue");
  assert.match(source, /@step-change="handleGuideStepChange"/);
  const handler = source.slice(source.indexOf("function handleGuideStepChange"), source.indexOf("watch(guideVisible"));
  assert.match(handler, /isGuideDemoMode\.value/);
  assert.match(handler, /step\.page !== "theme-create"/);
  assert.match(handler, /leaveGuideDemoToThemeManagement\(\)/);
  const overlay = readSource("../src/components/OnboardingGuide/OnboardingGuideOverlay.vue");
  assert.match(overlay, /"step-change": \[step: OnboardingGuideStep\]/);
  assert.match(overlay, /emit\("step-change", currentStep\.value\)/);
});

test("主题引导包含创建对象大步骤链且不复用新建主题链名", () => {
  const source = readSource("../src/views/onboardingGuideSteps.ts");
  assert.match(source, /const THEME_OBJECT_CHAIN_NAME = "创建对象"/);
  assert.match(source, /id: "theme-list-enter"/);
  assert.match(source, /theme-list-enter[\s\S]*?chain: THEME_OBJECT_CHAIN_NAME/);
});

test("主题管理页仅在引导进行中时为创建入口追加 guide 演示标记", () => {
  const source = readSource("../src/views/ThemeSpaceManagement/index.vue");
  assert.match(source, /\.\.\.\(guideVisible\.value \? \{ guide: "1" \} : \{\}\)/);
});

test("引导卡片下一步会同步触发按钮类步骤的真实目标点击", () => {
  const source = readSource("../src/components/OnboardingGuide/OnboardingGuideOverlay.vue");
  const moveFunction = source.slice(source.indexOf("function move(offset: number)"), source.indexOf("function skipChain()"));
  assert.match(moveFunction, /currentStep\.value\.advanceOnTargetClick/);
  assert.match(moveFunction, /target\?\.click\(\)/);
  assert.match(moveFunction, /goToStep\(index\.value \+ offset\)/);
});

test("演示模式下进入后续步骤时默认勾选全部实例、属性与关系", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/index.vue");
  assert.match(source, /function selectAllObjectInstances\(\)/);
  assert.match(source, /function selectAllObjectRelations\(\)/);
  const advanceFunction = source.slice(source.indexOf("async function advanceSubspaceCreateStep()"), source.indexOf("function querySpaceRelationTree"));
  assert.match(advanceFunction, /if \(isGuideDemoMode\.value\) selectAllObjectInstances\(\)/);
  assert.match(advanceFunction, /if \(isGuideDemoMode\.value\) selectAllObjectProperties\(\)/);
  assert.match(advanceFunction, /if \(isGuideDemoMode\.value\) selectAllObjectRelations\(\)/);
  const retryPropertiesFunction = source.slice(
    source.indexOf("async function retryObjectProperties()"),
    source.indexOf("/** @description 按选中对象逐个查询第一页实体实例。"),
  );
  assert.match(retryPropertiesFunction, /if \(isGuideDemoMode\.value\) selectAllObjectProperties\(\)/);
  const retryRelationsFunction = source.slice(
    source.indexOf("async function retryParentSpaceRelations()"),
    source.indexOf("/** @description 查询父空间关系分类树"),
  );
  assert.match(retryRelationsFunction, /if \(isGuideDemoMode\.value\) selectAllObjectRelations\(\)/);
});

test("演示模式下分类树面板注入演示工作区加载器", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/components/SubspaceCreateTreePanel.vue");
  assert.match(source, /guideMode/);
  assert.match(source, /loadGuideObjectWorkspace/);
});

test("演示模式下分类树加载完成后自动勾选全部演示对象", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/components/SubspaceCreateTreePanel.vue");
  assert.match(source, /watch\(treeData/);
  assert.match(source, /collectObjectIds/);
  assert.match(source, /setCheckedKeys\(objectIds\)/);
  assert.match(source, /syncSelectedTreeObjects\(\)/);
});

/**
 * @description 收集关系分类树中的关系链接。
 * @param node 关系分类树节点。
 * @returns 关系链接数组。
 */
function collectRelationLinks(node) {
  return [...(node?.links ?? []), ...(node?.children ?? []).flatMap((child) => collectRelationLinks(child))];
}
