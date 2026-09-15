import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse, compileScript } from '@vue/compiler-sfc';

test('menu supports collapse and shows space management without a home entry', () => {
  const source = readFileSync(new URL('../src/layout/components/NavigationMenu.vue', import.meta.url), 'utf8');
  const { descriptor } = parse(source);
  const compiled = compileScript(descriptor, { id: 'navigation' });
  assert.match(compiled.content, /update:collapsed/);
  assert.doesNotMatch(source, /index="\/workspace"/);
  assert.match(source, /index="\/workspace\/ontology-space-management"/);
  assert.match(source, /aircas-menu/);
});
