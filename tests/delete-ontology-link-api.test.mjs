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

describe("delete ontology link api", () => {
  test("deletes link by unique identifier on /ontology/link path with SUCCESS mock", () => {
    const apiSource = readSource("../src/apis/ontologyManageApi.ts");
    const typeSource = readSource("../src/types/apis/deleteOntologyLinkType.ts");
    const mockSource = readSource("../src/mocks/deleteOntologyLinkMock/deleteOntologyLinkMock.ts");
    const barrelSource = readSource("../src/apis/index.ts");
    const typesBarrel = readSource("../src/types/index.ts");

    assert.match(apiSource, /export function deleteOntologyLinkInterface\(\s*payload: DeleteOntologyLinkParams,?\s*\): Promise<ApiResponse<undefined>>/);
    assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/link\/" \+ encodeURIComponent\(payload\.linkUniqIdentifier\)/);
    assert.match(apiSource, /method:\s*"delete"/);
    assert.match(apiSource, /@param \{string\} payload\.linkUniqIdentifier/);

    assert.match(typeSource, /export interface DeleteOntologyLinkParams/);
    assert.match(typeSource, /linkUniqIdentifier:\s*string/);

    assert.match(mockSource, /export const deleteOntologyLinkMock: ApiResponse<undefined>/);
    assert.match(mockSource, /message: "SUCCESS"/);
    assert.match(mockSource, /code: 200/);

    assert.match(barrelSource, /deleteOntologyLinkInterface/);
    assert.match(typesBarrel, /DeleteOntologyLinkParams/);
  });

  test("relation workspace delete calls link api then reloads for table and graph", () => {
    const workspaceSource = readSource("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue");
    assert.match(workspaceSource, /@delete="openRelationDelete"/);
    assert.match(workspaceSource, /openRelationDelete\(asRelation\(scope\.row\)\)/);
    assert.match(workspaceSource, /deleteOntologyLinkInterface/);
    assert.match(workspaceSource, /linkUniqIdentifier/);
    assert.match(workspaceSource, /deleteOntologyLinkInterface\(\{\s*linkUniqIdentifier\s*\}\)/);
    assert.match(workspaceSource, /await loadSpaceRelationWorkspace\(\)/);
    assert.doesNotMatch(workspaceSource, /deleteRelationClass\(activeRelation\.value\.id\)/);
  });
});
