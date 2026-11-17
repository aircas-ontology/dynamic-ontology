import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, test } from "node:test";
/**
 * @description 读取仓库内相对本测试文件的源码文本。
 * @param {string} relativePath 相对路径。
 * @returns {string} 文件内容。
 */
function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("get ontology link list api", () => {
  test("api uses GET /ontology/link/list with spaceId and pagination query", () => {
    const apiSource = readSource("../src/apis/ontologyManageApi.ts");
    const typeSource = readSource("../src/types/apis/getOntologyLinkListType.ts");
    const apiBarrel = readSource("../src/apis/index.ts");
    const typeBarrel = readSource("../src/types/index.ts");
    assert.match(apiSource, /export function getOntologyLinkListInterface\(/);
    assert.match(apiSource, /GetOntologyLinkListParams/);
    assert.match(apiSource, /ApiResponse<GetOntologyLinkListData>/);
    assert.match(apiSource, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/link\/list"/);
    assert.match(apiSource, /method: "get"/);
    assert.match(apiSource, /params,/);
    assert.match(typeSource, /interface GetOntologyLinkListParams/);
    assert.match(typeSource, /spaceId:\s*number/);
    assert.match(typeSource, /relationName\?:\s*string/);
    assert.match(typeSource, /pageNum\?:\s*number/);
    assert.match(typeSource, /pageSize\?:\s*number/);
    assert.match(typeSource, /interface GetOntologyLinkListRecord/);
    assert.match(typeSource, /uniqueIdentifier:\s*string/);
    assert.match(typeSource, /name:\s*string/);
    assert.match(typeSource, /fromObject:\s*GetOntologyLinkListObject/);
    assert.match(typeSource, /toObject:\s*GetOntologyLinkListObject/);
    assert.match(typeSource, /interface GetOntologyLinkListObject/);
    assert.match(typeSource, /displayName:\s*string/);
    assert.match(typeSource, /apiName:\s*string/);
    assert.match(typeSource, /metaGroupId:\s*number\[\]/);
    assert.match(typeSource, /interface GetOntologyLinkListData/);
    assert.match(typeSource, /records:\s*GetOntologyLinkListRecord\[\]/);
    assert.match(typeSource, /total:\s*number/);
    assert.match(apiBarrel, /getOntologyLinkListInterface/);
    assert.match(typeBarrel, /GetOntologyLinkListData/);
    assert.match(typeBarrel, /GetOntologyLinkListParams/);
    assert.match(typeBarrel, /from "\.\/apis\/getOntologyLinkListType"/);
  });

  test("mock route and fixture register GET /ontology/link/list", () => {
    const routes = readSource("../src/mockData/routes.json");
    const fixture = readSource("../src/mockData/fixtures/ontology/link.list.get.json");
    assert.match(routes, /"method": "GET"[\s\S]*?"path": "\/ontology\/link\/list"[\s\S]*?link\.list\.get\.json/);
    assert.match(fixture, /"uniqueIdentifier": "4ed7c4da646f4006bec301815b61debb"/);
    assert.match(fixture, /"name": "搭载"/);
    assert.match(fixture, /"displayName": "飞机"/);
    assert.match(fixture, /"displayName": "导弹"/);
    assert.match(fixture, /"total": 10/);
  });

  test("mapper maps link list records to OntologyRelationClass rows", async () => {
    const mapperPath = new URL("../src/views/SpaceBehaviorWorkspace/utils/mapOntologyLinkListToRelationClass.ts", import.meta.url);
    assert.equal(existsSync(mapperPath), true, "missing mapOntologyLinkListToRelationClass");
    const { mapOntologyLinkListToRelationClass } = await import(mapperPath.href);
    const rows = mapOntologyLinkListToRelationClass([
      {
        uniqueIdentifier: "link-1",
        name: "搭载",
        fromObject: {
          uniqueIdentifier: "from-1",
          createTime: "2026-11-02 14:43:07",
          updateTime: "2026-11-02 14:43:07",
          latestQueryTime: "2026-11-02 14:43:07",
          displayName: "飞机",
          description: "src",
          apiName: "act_aircraft",
          metaGroupId: [],
          spaceId: 156,
          ontologyCategoryId: 626,
        },
        toObject: {
          uniqueIdentifier: "to-1",
          createTime: "2026-11-02 14:43:07",
          updateTime: "2026-11-02 14:43:07",
          latestQueryTime: "2026-11-02 14:43:07",
          displayName: "导弹",
          description: "dst",
          apiName: "act_missile",
          metaGroupId: [],
          spaceId: 156,
          ontologyCategoryId: 627,
        },
      },
    ]);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      id: "link-1",
      categoryId: "",
      categoryName: "",
      displayName: "搭载",
      apiName: "",
      sourceName: "飞机",
      targetName: "导弹",
      sourceOntologyId: "from-1",
      targetOntologyId: "to-1",
      cardinality: "一对多",
      description: "",
    });
    assert.deepEqual(
      mapOntologyLinkListToRelationClass([
        {
          uniqueIdentifier: "   ",
          name: "空白",
          fromObject: {
            uniqueIdentifier: "from-2",
            createTime: "",
            updateTime: "",
            latestQueryTime: "",
            displayName: "A",
            description: "",
            apiName: "a",
            metaGroupId: [],
            spaceId: 1,
            ontologyCategoryId: 1,
          },
          toObject: {
            uniqueIdentifier: "to-2",
            createTime: "",
            updateTime: "",
            latestQueryTime: "",
            displayName: "B",
            description: "",
            apiName: "b",
            metaGroupId: [],
            spaceId: 1,
            ontologyCategoryId: 2,
          },
        },
      ]),
      [],
    );
  });

  test("behavior form dialog loads relations from link list with search and page size 10", () => {
    const formSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue");
    assert.match(formSource, /getOntologyLinkListInterface/);
    assert.match(formSource, /mapOntologyLinkListToRelationClass/);
    assert.doesNotMatch(formSource, /getOntologyRelationCategoryTreeInterface/);
    assert.doesNotMatch(formSource, /mapOntologyRelationLinks/);
    assert.match(formSource, /relationName/);
    assert.match(formSource, /pageSize:\s*10/);
    assert.match(formSource, /relationTotal/);
    assert.match(formSource, /el-pagination/);
    assert.match(formSource, /按关系名称搜索/);
  });
});
