import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMemoryHistory, createRouter } from 'vue-router';
import { workspaceRoutes } from '../src/router/modules/workspaceRoutes.ts';

test('workspace child route resolves to the full text search page under the layout', () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: 'FullTextSearch' });
  assert.equal(route.path, '/workspace/full-text-search');
  assert.deepEqual(route.matched.map(record => record.name), ['Workspace', 'FullTextSearch']);
  assert.equal(route.meta.title, '全文检索');
});

test('full text search page exposes the retrieval input placeholder', () => {
  const source = readFileSync(new URL('../src/views/FullTextSearch/index.vue', import.meta.url), 'utf8');
  assert.match(source, /placeholder="检索空间，对象，实例，属性\.\."/);
  assert.match(source, /aircas-input/);
});
