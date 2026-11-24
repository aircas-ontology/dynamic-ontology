import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("entity ids query types expose batch params and nested entity properties", () => {
  const typeSource = readSource("../src/types/apis/postOntologyEntityIdsQueryType.ts");
  const barrel = readSource("../src/types/index.ts");
  assert.match(typeSource, /export interface OntologyEntityIdsQueryParam/);
  assert.match(typeSource, /entityPrimaryKeys\?:\s*unknown\[\]/);
  assert.match(typeSource, /export type PostOntologyEntityIdsQueryParams/);
  assert.match(typeSource, /propertyDisplayName\?/);
  assert.match(barrel, /PostOntologyEntityIdsQueryData,\s*PostOntologyEntityIdsQueryParams/);
});

test("entity ids query api posts array body to manage domain uri", () => {
  const apiSource = readSource("../src/apis/ontologyEntityApi.ts");
  assert.match(
    apiSource,
    /export function postOntologyEntityIdsQueryInterface\(\s*params: PostOntologyEntityIdsQueryParams,?\s*\):\s*Promise<ApiResponse<PostOntologyEntityIdsQueryData>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/entity\/query"/);
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports the entity ids query interface", () => {
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postOntologyEntityIdsQueryInterface/);
});

test("mockData registers entity query route with documented sample data", () => {
  const routes = readSource("../src/mockData/routes.json");
  assert.match(routes, /\/ontology\/entity\/query/);
  const fixture = readSource("../src/mockData/fixtures/ontology/entity/query.post.json");
  assert.match(fixture, /"code":\s*200/);
  assert.match(fixture, /"entityList"/);
  assert.match(fixture, /"propertyDisplayName"/);
});

test("entity detail composable no longer calls row_detail for property loading", () => {
  const source = readSource("../src/views/EntityBrowsingObjectProfile/composables/useObjectProfileEntityDetail.ts");
  assert.match(source, /postOntologyEntityIdsQueryInterface/);
  assert.match(source, /postGetOntologyEntityRowDetailPageInterface/);
  assert.match(source, /getOntologyPropertyByOntologyIdInterface/);
  assert.doesNotMatch(source, /postGetOntologyEntityRowDetailInterface/);
});
