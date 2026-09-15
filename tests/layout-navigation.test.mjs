import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse, compileScript } from '@vue/compiler-sfc';

test('menu supports collapsed binding and targets the existing workspace', () => {
  const source = readFileSync(new URL('../src/layout/components/NavigationMenu.vue', import.meta.url), 'utf8');
  const { descriptor } = parse(source);
  const compiled = compileScript(descriptor, { id: 'navigation' });
  assert.match(compiled.content, /update:collapsed/);
  assert.match(source, /index="\/workspace"/);
  assert.match(source, /aircas-menu/);
});

test('menu includes full text search entry with named route', () => {
  const source = readFileSync(new URL('../src/layout/components/NavigationMenu.vue', import.meta.url), 'utf8');
  assert.match(source, /全文检索/);
  assert.match(source, /name:\s*['"]FullTextSearch['"]/);
});
