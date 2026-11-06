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

describe("get ontology link by unique identifier api", () => {
  test("api uses GET /ontology/link with uniqueIdentifier query", () => {
    const apiSource = readSource("../src/apis/ontologyManageApi.ts");
    const typeSource = readSource("../src/types/apis/getOntologyLinkByUniqueIdentifierType.ts");
    const apiBarrel = readSource("../src/apis/index.ts");
    const typeBarrel = readSource("../src/types/index.ts");
    assert.match(apiSource, /export function getOntologyLinkByUniqueIdentifierInterface\(/);
    assert.match(apiSource, /GetOntologyLinkByUniqueIdentifierParams/);
    assert.match(apiSource, /ApiResponse<GetOntologyLinkByUniqueIdentifierData \| null>/);
    assert.match(apiSource, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/link"/);
    assert.match(apiSource, /method: "get"/);
    assert.match(apiSource, /params,/);
    assert.match(typeSource, /interface GetOntologyLinkByUniqueIdentifierParams/);
    assert.match(typeSource, /uniqueIdentifier: string/);
    assert.match(typeSource, /interface GetOntologyLinkByUniqueIdentifierData/);
    assert.match(typeSource, /ontologyUniqueIdentifierFrom: string/);
    assert.match(typeSource, /ontologyNameFrom: string/);
    assert.match(typeSource, /ontologyUniqueIdentifierTo: string/);
    assert.match(typeSource, /ontologyNameTo: string/);
    assert.match(typeSource, /categoryId: number/);
    assert.match(typeSource, /apiName: string/);
    assert.match(apiBarrel, /getOntologyLinkByUniqueIdentifierInterface/);
    assert.match(typeBarrel, /GetOntologyLinkByUniqueIdentifierData/);
    assert.match(typeBarrel, /GetOntologyLinkByUniqueIdentifierParams/);
  });

  test("mock route and fixture register GET /ontology/link", () => {
    const routes = readSource("../src/mockData/routes.json");
    const fixture = readSource("../src/mockData/fixtures/ontology/link.get.json");
    const mockSource = readSource("../src/mocks/getOntologyLinkByUniqueIdentifierMock/getOntologyLinkByUniqueIdentifierMock.ts");
    assert.match(routes, /"method": "GET"[\s\S]*?"path": "\/ontology\/link"[\s\S]*?link\.get\.json/);
    assert.match(fixture, /"ontologyNameFrom": "飞机"/);
    assert.match(fixture, /"ontologyNameTo": "导弹"/);
    assert.match(fixture, /"uniqueIdentifier": "c91e24645b5a46019fc48060a2103ab0"/);
    assert.match(mockSource, /getOntologyLinkByUniqueIdentifierMock/);
    assert.match(mockSource, /ontologyNameFrom:/);
  });
});
