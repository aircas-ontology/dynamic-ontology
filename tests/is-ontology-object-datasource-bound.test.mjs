import assert from "node:assert/strict";
import { test } from "node:test";
import { isOntologyObjectDatasourceBound } from "../src/views/ObjectWorkspacePanel/utils/isOntologyObjectDatasourceBound.ts";

test("isOntologyObjectDatasourceBound is false when no property has a datasource id", () => {
  assert.equal(isOntologyObjectDatasourceBound([]), false);
  assert.equal(isOntologyObjectDatasourceBound([{ datasourceId: "" }, { datasourceId: "  " }, {}]), false);
  assert.equal(isOntologyObjectDatasourceBound([{ datasourceId: null }]), false);
});

test("isOntologyObjectDatasourceBound is true when any property has a non-empty datasource id", () => {
  assert.equal(isOntologyObjectDatasourceBound([{ datasourceId: "ds-1" }]), true);
  assert.equal(isOntologyObjectDatasourceBound([{ datasourceId: "" }, { datasourceId: " table_a " }]), true);
});
