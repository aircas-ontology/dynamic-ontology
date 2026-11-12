import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

/**
 * @description 读取仓库内相对本测试文件的源码文本。
 * @param {string} relativePath 相对路径。
 * @returns {string} 文件内容。
 */
function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("get ontology instance url list api", () => {
  test("api uses GET /ontology/instance/url/list with documented query fields", () => {
    const apiSource = readSource("../src/apis/ontologyInstanceUrlApi.ts");
    const typeSource = readSource("../src/types/apis/getOntologyInstanceUrlListType.ts");
    const apiBarrel = readSource("../src/apis/index.ts");
    const typeBarrel = readSource("../src/types/index.ts");
    assert.match(apiSource, /export function getOntologyInstanceUrlListInterface\(/);
    assert.match(apiSource, /params: GetOntologyInstanceUrlListParams/);
    assert.match(apiSource, /Promise<ApiResponse<GetOntologyInstanceUrlListData>>/);
    assert.match(apiSource, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/instance\/url\/list"/);
    assert.match(apiSource, /method: "get"/);
    assert.match(apiSource, /params/);
    assert.match(typeSource, /interface GetOntologyInstanceUrlListParams/);
    assert.match(typeSource, /spaceId: number/);
    assert.match(typeSource, /objectId\?: string/);
    assert.match(typeSource, /instanceId\?: string/);
    assert.match(typeSource, /interface OntologyInstanceUrlItem/);
    assert.match(typeSource, /url\?: string/);
    assert.match(typeSource, /type GetOntologyInstanceUrlListData = OntologyInstanceUrlItem\[\]/);
    assert.match(apiBarrel, /getOntologyInstanceUrlListInterface/);
    assert.match(typeBarrel, /GetOntologyInstanceUrlListData/);
    assert.match(typeBarrel, /GetOntologyInstanceUrlListParams/);
    assert.match(typeBarrel, /OntologyInstanceUrlItem/);
  });

  test("mock route and fixture register GET /ontology/instance/url/list", () => {
    const routes = readSource("../src/mockData/routes.json");
    const fixture = readSource("../src/mockData/fixtures/instance/url/list.get.json");
    assert.match(routes, /"method": "GET"[\s\S]*"path": "\/ontology\/instance\/url\/list"[\s\S]*list\.get\.json/);
    assert.match(fixture, /"url"/);
    assert.match(fixture, /"objectId"/);
    assert.match(fixture, /"instanceId"/);
  });
});
