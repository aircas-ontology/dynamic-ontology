import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { workspaceRoutes } from '../src/router/modules/workspaceRoutes.ts';
import { findSpaceById } from '../src/views/OntologySpaceManagementDetail/utils/spaceLookup.ts';
import { tabFromRouteName, routeNameForTab } from '../src/views/OntologySpaceManagementDetail/utils/workspaceTabs.ts';
import { useOntologySpaceDetailStore } from '../src/stores/useOntologySpaceDetailStore.ts';

test('space detail parent and child routes resolve under the workspace layout', () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const overview = router.resolve({ name: 'OntologySpaceManagementDetailOverview', params: { spaceId: 'army' } });
  assert.equal(overview.path, '/workspace/ontology-space-management/army/overview');
  assert.deepEqual(overview.matched.map((record) => record.name), [
    'Workspace',
    'OntologySpaceManagementDetail',
    'OntologySpaceManagementDetailOverview',
  ]);

  const objectRoute = router.resolve({ name: 'OntologySpaceManagementDetailObject', params: { spaceId: 'army' } });
  assert.equal(objectRoute.path, '/workspace/ontology-space-management/army/object');

  const functionRoute = router.resolve({
    name: 'OntologySpaceManagementDetailFunctionOperator',
    params: { spaceId: 'navy' },
  });
  assert.equal(functionRoute.path, '/workspace/ontology-space-management/navy/function-operator');
});

test('space detail parent redirects to overview for a space id', () => {
  const detailRoute = workspaceRoutes[0]?.children?.find((route) => route.name === 'OntologySpaceManagementDetail');
  assert.ok(detailRoute);
  assert.deepEqual(detailRoute.redirect, { name: 'OntologySpaceManagementDetailOverview' });
  assert.equal(detailRoute.children?.length, 6);
});

test('space lookup returns mock space or null', () => {
  const spaces = [
    {
      id: 'army',
      apiName: 'army_space',
      displayName: '陆军本体空间',
      description: '',
      iconUrl: '',
      category: '陆军',
      metrics: { ontology: 1, behavior: 1, relation: 1, rule: 1, source: 1 },
      createdAt: '',
      createdBy: 'admin',
      updatedAt: '',
      isSubspace: false,
      parentSpaceDisplayName: '',
    },
  ];
  assert.equal(findSpaceById(spaces, 'army')?.displayName, '陆军本体空间');
  assert.equal(findSpaceById(spaces, 'missing'), null);
});

test('workspace tab helpers map route names and tab ids', () => {
  assert.equal(routeNameForTab('relation'), 'OntologySpaceManagementDetailRelation');
  assert.equal(tabFromRouteName('OntologySpaceManagementDetailBehaviorSchedule'), 'behavior-schedule');
  assert.equal(tabFromRouteName('Unknown'), null);
});

test('ontology space detail store keeps and clears the breadcrumb space name', () => {
  setActivePinia(createPinia());
  const store = useOntologySpaceDetailStore();
  store.setCurrentSpace('army', '陆军本体空间');
  assert.equal(store.spaceId, 'army');
  assert.equal(store.displayName, '陆军本体空间');
  store.clearCurrentSpace();
  assert.equal(store.spaceId, '');
  assert.equal(store.displayName, '');
});

test('space management enter action navigates to the overview route', () => {
  const source = readFileSync(
    new URL('../src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /action === ["']enter["']/);
  assert.match(source, /OntologySpaceManagementDetailOverview/);
});

test('breadcrumb includes the current space name while inside a space', () => {
  const source = readFileSync(new URL('../src/layout/components/BreadcrumbBar.vue', import.meta.url), 'utf8');
  assert.match(source, /OntologySpaceManagement/);
  assert.match(source, /displayName|spaceDisplayName/);
  assert.match(source, /useOntologySpaceDetailStore/);
});

test('workspace type tabs keep prototype labels including function operator', () => {
  const source = readFileSync(
    new URL('../src/views/OntologySpaceManagementDetail/components/WorkspaceTypeTabs.vue', import.meta.url),
    'utf8',
  );
  assert.match(source, /函数算子/);
  assert.match(source, /行为调度/);
  assert.match(source, /workspace-type-tabs/);
});
