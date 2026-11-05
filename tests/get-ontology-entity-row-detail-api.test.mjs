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

describe("get ontology entity row detail api", () => {
  test("api uses POST /ontology/entity/row_detail with documented body fields", () => {
    const apiSource = readSource("../src/apis/ontologyEntityApi.ts");
    const typeSource = readSource("../src/types/apis/getOntologyEntityRowDetailType.ts");
    const apiBarrel = readSource("../src/apis/index.ts");
    const typeBarrel = readSource("../src/types/index.ts");
    assert.match(
      apiSource,
      /export function postGetOntologyEntityRowDetailInterface\(params: GetOntologyEntityRowDetailParams\): Promise<ApiResponse<GetOntologyEntityRowDetailData>>/,
    );
    assert.match(apiSource, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/entity\/row_detail"/);
    assert.match(apiSource, /method: "post"/);
    assert.match(apiSource, /data: params/);
    assert.match(typeSource, /interface GetOntologyEntityRowDetailParams/);
    assert.match(typeSource, /ontologyUniqueIdentifier: string/);
    assert.match(typeSource, /entityPrimaryKey:/);
    assert.match(typeSource, /sort: "ASC" \| "DESC"/);
    assert.match(typeSource, /interface OntologyEntityRowDetailVO/);
    assert.match(typeSource, /propertyGroups:/);
    assert.match(typeSource, /dataPrimaryKey:/);
    assert.match(typeSource, /propertyDisplayName:/);
    assert.match(typeSource, /type GetOntologyEntityRowDetailData = OntologyEntityRowDetailVO \| null/);
    assert.match(apiBarrel, /postGetOntologyEntityRowDetailInterface/);
    assert.match(typeBarrel, /GetOntologyEntityRowDetailData/);
    assert.match(typeBarrel, /GetOntologyEntityRowDetailParams/);
    assert.match(typeBarrel, /OntologyEntityRowDetailVO/);
  });

  test("mock route and fixture register POST /ontology/entity/row_detail", () => {
    const routes = readSource("../src/mockData/routes.json");
    const fixture = readSource("../src/mockData/fixtures/ontology/entity/rowDetail.post.json");
    const mockSource = readSource("../src/mocks/getOntologyEntityRowDetailMock/getOntologyEntityRowDetailMock.ts");
    assert.match(routes, /"method": "POST"[\s\S]*"path": "\/ontology\/entity\/row_detail"[\s\S]*rowDetail\.post\.json/);
    assert.match(fixture, /"propertyGroups"/);
    assert.match(fixture, /"storageGroup": "engine"/);
    assert.match(fixture, /"propertyDisplayName": "加力推力"/);
    assert.match(mockSource, /getOntologyEntityRowDetailMock/);
    assert.match(mockSource, /propertyGroups:/);
  });
});
