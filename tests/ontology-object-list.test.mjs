import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("object cards hide the parent ontology row when none is available", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue");
  assert.match(source, /parentDisplayName !== '无'/);
  assert.doesNotMatch(source, /父本体：—/);
  assert.doesNotMatch(source, /ontology-object-card__parent--placeholder/);
});

test("object table operation column keeps all actions on one line", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue");
  assert.match(source, /<el-table-column label="操作" width="300" fixed="right">/);
  assert.match(source, /white-space:\s*nowrap/);
});
