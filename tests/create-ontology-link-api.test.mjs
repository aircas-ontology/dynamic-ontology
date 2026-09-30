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

describe("create ontology link api", () => {
  test("posts CreateOntologyLinkParams to /ontology/link with SUCCESS mock", () => {
    const apiSource = readSource("../src/apis/ontologyManageApi.ts");
    const typeSource = readSource("../src/types/apis/createOntologyLinkType.ts");
    const mockSource = readSource("../src/mocks/createOntologyLinkMock/createOntologyLinkMock.ts");
    const barrelSource = readSource("../src/apis/index.ts");
    const typesBarrel = readSource("../src/types/index.ts");

    assert.match(apiSource, /export function postCreateOntologyLinkInterface\(\s*payload: CreateOntologyLinkParams,?\s*\): Promise<ApiResponse<undefined>>/);
    assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/link"/);
    assert.match(apiSource, /method:\s*"post"/);
    assert.match(apiSource, /data: payload/);
    assert.match(apiSource, /@param \{string\} payload\.name/);
    assert.match(apiSource, /@param \{string\} payload\.ontologyUniqueIdentifierFrom/);
    assert.match(apiSource, /@param \{string\} payload\.ontologyUniqueIdentifierTo/);
    assert.match(apiSource, /@param \{number\} \[payload\.categoryId\]/);
    assert.match(apiSource, /@param \{string\} payload\.apiName/);
    assert.match(apiSource, /@param \{string\} \[payload\.description\]/);
    assert.match(apiSource, /@param \{number\} payload\.spaceId/);

    assert.match(typeSource, /export interface CreateOntologyLinkParams/);
    assert.match(typeSource, /name:\s*string/);
    assert.match(typeSource, /ontologyUniqueIdentifierFrom:\s*string/);
    assert.match(typeSource, /ontologyUniqueIdentifierTo:\s*string/);
    assert.match(typeSource, /categoryId\?:\s*number/);
    assert.match(typeSource, /apiName:\s*string/);
    assert.match(typeSource, /description\?:\s*string/);
    assert.match(typeSource, /spaceId:\s*number/);

    assert.match(mockSource, /export const createOntologyLinkMock: ApiResponse<undefined>/);
    assert.match(mockSource, /message: "SUCCESS"/);
    assert.match(mockSource, /code: 200/);

    assert.match(barrelSource, /postCreateOntologyLinkInterface/);
    assert.match(typesBarrel, /CreateOntologyLinkParams/);
  });

  test("relation workspace create posts link api then reloads workspace", () => {
    const workspaceSource = readSource("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue");
    assert.match(workspaceSource, /postCreateOntologyLinkInterface/);
    assert.match(workspaceSource, /ontologyUniqueIdentifierFrom/);
    assert.match(workspaceSource, /ontologyUniqueIdentifierTo/);
    assert.match(workspaceSource, /await loadSpaceRelationWorkspace\(\)/);
    assert.doesNotMatch(workspaceSource, /createRelationClass\(\{/);
  });
});
