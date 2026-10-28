import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("action category tree query API follows the documented GET contract", () => {
  const source = readSource("../src/apis/actionCategoryApi.ts");
  assert.match(
    source,
    /export function getActionCategoryTreeInterface\(params: GetActionCategoryTreeParams\): Promise<ApiResponse<ActionCategoryVO \| ActionCategoryVO\[\]>>/,
  );
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/action_category\/tree"/);
  assert.match(source, /method: "get"/);
  assert.match(source, /params,/);
});

test("action category tree types and exports use the documented sample fields", () => {
  const typeSource = readSource("../src/types/apis/getActionCategoryTreeType.ts");
  const barrelSource = readSource("../src/types/index.ts");
  assert.match(typeSource, /interface GetActionCategoryTreeParams[\s\S]*spaceId: number/);
  assert.match(
    typeSource,
    /interface ActionCategoryVO[\s\S]*id\?: number[\s\S]*name\?: string[\s\S]*children\?: ActionCategoryVO\[\][\s\S]*items\?: ActionCategoryVO \| ActionCategoryVO\[\]/,
  );
  assert.match(barrelSource, /ActionCategoryVO, GetActionCategoryTreeParams[\s\S]*getActionCategoryTreeType/);
});

test("action category tree mock follows the documented success response", () => {
  const source = readSource("../src/mocks/getActionCategoryTreeMock/getActionCategoryTreeMock.ts");
  assert.match(source, /getActionCategoryTreeMock: ApiResponse<ActionCategoryVO>/);
  assert.match(source, /code: 200/);
  assert.match(source, /name: "行为分类"/);
  assert.match(source, /children: \[\]/);
});
