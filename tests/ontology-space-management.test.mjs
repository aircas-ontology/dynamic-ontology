import test from 'node:test';
import assert from 'node:assert/strict';
import { filterSpaces, saveSpace, removeSpace, parseSpaceImport, serializeSpace } from '../src/views/OntologySpaceManagement/utils/spaceOperations.ts';
import { createMemoryHistory, createRouter } from 'vue-router';
import { workspaceRoutes } from '../src/router/modules/workspaceRoutes.ts';

const draft = { apiName: 'demo_space', displayName: '演示空间', description: '示例', iconUrl: '' };
test('create, update, duplicate API validation and deletion preserve input', () => {
  const spaces = saveSpace([], draft);
  assert.equal(spaces.length, 1);
  assert.throws(() => saveSpace(spaces, draft), /API/);
  const edited = saveSpace(spaces, { ...draft, displayName: '修改' }, spaces[0].id);
  assert.equal(edited[0].displayName, '修改');
  assert.equal(spaces[0].displayName, '演示空间');
  assert.equal(removeSpace(edited, spaces[0].id).length, 0);
  assert.throws(() => saveSpace(spaces, draft, 'missing'), /不存在/);
  assert.throws(() => saveSpace([], { ...draft, apiName: '9bad' }), /API/);
  assert.throws(() => saveSpace([], { ...draft, displayName: ' ' }), /名称/);
});
test('search trims and ignores case, sort and pagination do not mutate data', () => {
  let spaces = saveSpace([], draft);
  spaces = saveSpace(spaces, { ...draft, apiName: 'alpha', displayName: 'Alpha' });
  assert.equal(filterSpaces(spaces, ' ALPHA ', 'asc', 1, 5).total, 1);
  assert.equal(filterSpaces(spaces, 'missing', 'asc', 1, 5).items.length, 0);
  const first = filterSpaces(spaces, '', 'asc', 1, 1);
  const last = filterSpaces(spaces, '', 'desc', 1, 1);
  assert.notEqual(first.items[0].id, last.items[0].id);
  assert.equal(filterSpaces(spaces, '', 'asc', 99, 1).page, 2);
  assert.equal(spaces[0].displayName, '演示空间');
});
test('export imports consistently and rejects malformed or incomplete data', () => {
  const [space] = saveSpace([], draft);
  assert.deepEqual(parseSpaceImport(serializeSpace(space)), draft);
  for (const value of ['no json', '{}', 'null', '{"ontologySpace":{"apiName":4}}']) {
    assert.throws(() => parseSpaceImport(value));
  }
});

test('workspace child route resolves to the space management page under the layout', () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: 'OntologySpaceManagement' });
  assert.equal(route.path, '/workspace/ontology-space-management');
  assert.deepEqual(route.matched.map(record => record.name), ['Workspace', 'OntologySpaceManagement']);
  assert.equal(route.meta.title, '本体空间管理');
});
