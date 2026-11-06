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

describe("post ontology entity all link api", () => {
  test("api uses POST /ontology/entity/link_between with From/To body", () => {
    const apiSource = readSource("../src/apis/ontologyEntityApi.ts");
    const typeSource = readSource("../src/types/apis/postOntologyEntityAllLinkType.ts");
    const apiBarrel = readSource("../src/apis/index.ts");
    const typeBarrel = readSource("../src/types/index.ts");
    assert.match(apiSource, /export function postOntologyEntityAllLinkInterface\(/);
    assert.match(apiSource, /PostOntologyEntityAllLinkParams/);
    assert.match(apiSource, /ApiResponse<PostOntologyEntityAllLinkData>/);
    assert.match(apiSource, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/entity\/link_between"/);
    assert.match(apiSource, /method: "post"/);
    assert.match(apiSource, /data: params/);
    assert.match(typeSource, /interface PostOntologyEntityAllLinkParams/);
    assert.match(typeSource, /ontologyUniqueIdentifierFrom:/);
    assert.match(typeSource, /entityPrimaryKeyFrom:/);
    assert.match(typeSource, /ontologyUniqueIdentifierTo:/);
    assert.match(typeSource, /entityPrimaryKeyTo:/);
    assert.match(typeSource, /interface PostOntologyEntityAllLinkItem/);
    assert.match(typeSource, /interface PostOntologyEntityAllLinkVisibilityWindow/);
    assert.match(typeSource, /linkName\?:/);
    assert.match(typeSource, /visibilityWindows\?:/);
    assert.match(typeSource, /status\?:/);
    assert.match(typeSource, /type PostOntologyEntityAllLinkData = PostOntologyEntityAllLinkItem\[\]/);
    assert.match(apiBarrel, /postOntologyEntityAllLinkInterface/);
    assert.match(typeBarrel, /PostOntologyEntityAllLinkData/);
    assert.match(typeBarrel, /PostOntologyEntityAllLinkItem/);
    assert.match(typeBarrel, /PostOntologyEntityAllLinkParams/);
    assert.match(typeBarrel, /PostOntologyEntityAllLinkVisibilityWindow/);
    assert.doesNotMatch(typeBarrel, /OntologyEntityIdsQueryParam/);
  });

  test("mock route and fixture register POST /ontology/entity/link_between sample data", () => {
    const routes = readSource("../src/mockData/routes.json");
    const fixture = readSource("../src/mockData/fixtures/ontology/entity/allLink.post.json");
    const mockSource = readSource("../src/mocks/postOntologyEntityAllLinkMock/postOntologyEntityAllLinkMock.ts");
    assert.match(routes, /"method": "POST"[\s\S]*?"path": "\/ontology\/entity\/link_between"[\s\S]*?allLink\.post\.json/);
    assert.match(fixture, /"linkName": "搭载"/);
    assert.match(fixture, /"status": "ENABLE"/);
    assert.match(fixture, /"visibilityWindows"/);
    assert.match(mockSource, /postOntologyEntityAllLinkMock/);
    assert.match(mockSource, /linkName: "搭载"/);
    assert.match(mockSource, /status: "ENABLE"/);
    assert.match(mockSource, /visibilityWindows:/);
  });
});
