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

describe("test ontology action api", () => {
  test("api uses POST /ontology/action/test with documented body fields", () => {
    const apiSource = readSource("../src/apis/ontologyActionApi.ts");
    const typeSource = readSource("../src/types/apis/testOntologyActionType.ts");
    const apiBarrel = readSource("../src/apis/index.ts");
    const typeBarrel = readSource("../src/types/index.ts");
    assert.match(
      apiSource,
      /export function postTestOntologyActionInterface\(params: TestOntologyActionParams\): Promise<ApiResponse<TestOntologyActionData>>/,
    );
    assert.match(apiSource, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/action\/test"/);
    assert.match(apiSource, /method: "post"/);
    assert.match(apiSource, /data: params/);
    assert.match(typeSource, /interface TestOntologyActionParams/);
    assert.match(typeSource, /ontologySpaceId: string/);
    assert.match(typeSource, /actionApi: string/);
    assert.match(typeSource, /entityPrimaryKey: string \| number \| boolean \| Record<string, unknown>/);
    assert.match(typeSource, /dataPrimaryKey\?:/);
    assert.match(typeSource, /linkEntityPrimaryKey\?:/);
    assert.match(typeSource, /params\?: Record<string, unknown>/);
    assert.match(typeSource, /interface TestOntologyActionResult/);
    assert.match(typeSource, /actionApi: string/);
    assert.match(typeSource, /message: string/);
    assert.match(typeSource, /result: string/);
    assert.match(typeSource, /type TestOntologyActionData = TestOntologyActionResult \| null/);
    assert.match(apiBarrel, /postTestOntologyActionInterface/);
    assert.match(typeBarrel, /TestOntologyActionData/);
    assert.match(typeBarrel, /TestOntologyActionParams/);
    assert.match(typeBarrel, /TestOntologyActionResult/);
  });

  test("mock route and fixture register POST /ontology/action/test", () => {
    const routes = readSource("../src/mockData/routes.json");
    const fixture = readSource("../src/mockData/fixtures/ontology/action.test.post.json");
    const mockSource = readSource("../src/mocks/testOntologyActionMock/testOntologyActionMock.ts");
    assert.match(routes, /"method": "POST"[\s\S]*"path": "\/ontology\/action\/test"[\s\S]*action\.test\.post\.json/);
    assert.match(fixture, /"code": 200/);
    assert.match(fixture, /"message": "SUCCESS"/);
    assert.match(fixture, /"data": null/);
    assert.match(mockSource, /testOntologyActionMock/);
    assert.match(mockSource, /data: null/);
  });
});
