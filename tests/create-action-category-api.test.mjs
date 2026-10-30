import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("action category create API follows the documented POST contract", () => {
  const source = readSource("../src/apis/actionCategoryApi.ts");
  assert.match(source, /export function createActionCategoryInterface\(params: CreateActionCategoryParams\): Promise<ApiResponse<unknown>>/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/action_category"/);
  assert.match(source, /method: "post"/);
  assert.match(source, /data: params/);
});

test("space behavior workspace accepts the service success code used by ontology management", () => {
  const source = readSource("../src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts");
  assert.match(source, /response\.code !== 0 && response\.code !== 200/);
});
