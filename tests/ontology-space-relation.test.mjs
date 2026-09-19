import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createMemoryHistory, createRouter } from 'vue-router';
import { workspaceRoutes } from '../src/router/modules/workspaceRoutes.ts';
import { createOntologySpaceRelationWorkspaceData } from '../src/mocks/ontologySpaceRelationMock/ontologySpaceRelationMock.ts';
import { filterRelationsByHop } from '../src/views/OntologySpaceManagementDetail/utils/spaceRelationGraph.ts';
import {
  addRelation,
  addRelationCategory,
  filterRelationsByCategory,
  removeRelation,
  removeRelationCategory,
} from '../src/views/OntologySpaceManagementDetail/utils/relationOperations.ts';
import { ROOT_RELATION_CATEGORY_ID } from '../src/types/pages/ontologySpaceRelationType.ts';

test('relation child route points to the space relation workspace component', () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: 'OntologySpaceManagementDetailRelation', params: { spaceId: 'army' } });
  assert.equal(route.path, '/workspace/ontology-space-management/army/relation');
  const source = readFileSync(new URL('../src/router/modules/workspaceRoutes.ts', import.meta.url), 'utf8');
  assert.match(source, /SpaceRelationWorkspace\.vue/);
});

test('hop filter keeps only adjacent layers from the seed', () => {
  const data = createOntologySpaceRelationWorkspaceData();
  const filtered = filterRelationsByHop(data.relations, ['福特级航空母舰(CVN)'], 1);
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((item) => item.sourceName === '福特级航空母舰(CVN)' || item.targetName === '福特级航空母舰(CVN)'));
});

test('category filter includes nested category relations', () => {
  const data = createOntologySpaceRelationWorkspaceData();
  const filtered = filterRelationsByCategory(data.relations, data.categoryTree, 'rel-combat');
  assert.ok(filtered.some((item) => item.categoryId === 'rel-combat-command'));
  assert.ok(filtered.some((item) => item.categoryId === 'rel-combat-support'));
});

test('relation 3d graph does not load entity svg node icons', () => {
  const graphSource = readFileSync(new URL('../src/views/OntologySpaceManagementDetail/composables/useRelationGraph3d.ts', import.meta.url), 'utf8');
  const textureSource = readFileSync(new URL('../src/views/OntologySpaceManagementDetail/utils/relationGraph3dTexture.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(graphSource, /resolveRelationObjectIcon|relationObjectIcon|createRelationNodeTexture/);
  assert.doesNotMatch(textureSource, /createRelationNodeTexture/);
  assert.equal(existsSync(new URL('../src/views/OntologySpaceManagementDetail/utils/relationObjectIcon.ts', import.meta.url)), false);
  assert.equal(existsSync(new URL('../src/assets/pages/ontologySpaceManagementDetail/entities', import.meta.url)), false);
});

test('relation mock CRUD creates and removes categories and relations', () => {
  let data = createOntologySpaceRelationWorkspaceData();
  data = addRelationCategory(data, { parentId: ROOT_RELATION_CATEGORY_ID, name: '临时分类', color: '#07eaff' });
  const created = data.categoryTree[0]?.children.find((item) => item.label === '临时分类');
  assert.ok(created);
  data = addRelation(data, {
    categoryId: created.id,
    displayName: '临时关系',
    apiName: 'temp_relation_api',
    sourceName: '对象A',
    targetName: '对象B',
    cardinality: '一对一',
    description: '测试',
  });
  assert.ok(data.relations.some((item) => item.apiName === 'temp_relation_api'));
  const relationId = data.relations.find((item) => item.apiName === 'temp_relation_api')?.id || '';
  data = removeRelation(data, relationId);
  data = removeRelationCategory(data, created.id);
  assert.equal(data.categoryTree[0]?.children.some((item) => item.id === created.id), false);
});
