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

describe("post ontology action basic function common properties api", () => {
  test("api uses POST /ontology/action/basic-function/common-properties with documented body fields", () => {
    const apiSource = readSource("../src/apis/ontologyActionApi.ts");
    const typeSource = readSource("../src/types/apis/postOntologyActionBasicFunctionCommonPropertiesType.ts");
    const apiBarrel = readSource("../src/apis/index.ts");
    const typeBarrel = readSource("../src/types/index.ts");
    assert.match(
      apiSource,
      /export function postOntologyActionBasicFunctionCommonPropertiesInterface\(params: PostOntologyActionBasicFunctionCommonPropertiesParams\): Promise<ApiResponse<PostOntologyActionBasicFunctionCommonPropertiesData>>/,
    );
    assert.match(apiSource, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/action\/basic-function\/common-properties"/);
    assert.match(apiSource, /method: "post"/);
    assert.match(apiSource, /data: params/);
    assert.match(typeSource, /interface PostOntologyActionBasicFunctionCommonPropertiesParams/);
    assert.match(typeSource, /ontologySpaceId\?: number/);
    assert.match(typeSource, /ontologyIdentifiers: string\[\]/);
    assert.match(typeSource, /interface PostOntologyActionBasicFunctionCommonPropertiesData/);
    assert.match(typeSource, /ontologyIdentifiers: string\[\]/);
    assert.match(typeSource, /ontologyNames: string\[\]/);
    assert.match(typeSource, /properties: PostOntologyActionBasicFunctionCommonProperty\[\]/);
    assert.match(typeSource, /interface PostOntologyActionBasicFunctionCommonProperty/);
    assert.match(typeSource, /apiName: string/);
    assert.match(typeSource, /propertyType: string/);
    assert.match(typeSource, /isPrimaryKey: boolean/);
    assert.match(typeSource, /isTitleKey: boolean/);
    assert.match(typeSource, /displayNames: string\[\]/);
    assert.match(apiBarrel, /postOntologyActionBasicFunctionCommonPropertiesInterface/);
    assert.match(typeBarrel, /PostOntologyActionBasicFunctionCommonPropertiesData/);
    assert.match(typeBarrel, /PostOntologyActionBasicFunctionCommonPropertiesParams/);
    assert.match(typeBarrel, /PostOntologyActionBasicFunctionCommonProperty/);
  });

  test("mock route and fixture register POST /ontology/action/basic-function/common-properties", () => {
    const routes = readSource("../src/mockData/routes.json");
    const fixture = readSource("../src/mockData/fixtures/ontology/action.basicFunction.commonProperties.post.json");
    assert.match(
      routes,
      /"method": "POST"[\s\S]*"path": "\/ontology\/action\/basic-function\/common-properties"[\s\S]*action\.basicFunction\.commonProperties\.post\.json/,
    );
    assert.match(fixture, /"code": 200/);
    assert.match(fixture, /"message": "SUCCESS"/);
    assert.match(fixture, /"apiName": "name"/);
    assert.match(fixture, /"displayNames"/);
    assert.match(fixture, /"ontologyIdentifiers"/);
  });

  test("basic function form loads select field options via common-properties for one or many objects", () => {
    const formSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue");
    const buildSource = readSource("../src/views/SpaceBehaviorWorkspace/utils/buildBasicFunctionCreateActionParams.ts");
    assert.match(formSource, /postOntologyActionBasicFunctionCommonPropertiesInterface/);
    assert.match(formSource, /loadBasicFunctionSelectFieldOptions/);
    assert.match(formSource, /ontologyIdentifiers/);
    assert.doesNotMatch(buildSource, /多对象时请选择聚合类型/);
    assert.match(formSource, /showBasicFunctionSingleResultModeToggle = computed\(\(\) => showBasicFunctionOperatorSection\.value && basicFunctionOntologyIds\.value\.length >= 1\)/);
    assert.match(
      formSource,
      /showBasicFunctionSelectFields = computed\(\(\) => showBasicFunctionSingleResultModeToggle\.value && basicFunctionSingleResultMode\.value === "query"\)/,
    );
    assert.doesNotMatch(
      formSource,
      /basicFunctionOntologyIds\.value\.length > 1 \|\| \(basicFunctionOntologyIds\.value\.length === 1 && basicFunctionSingleResultMode\.value === "aggregate"\)/,
    );
  });
});
