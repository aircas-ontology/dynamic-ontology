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

describe("update ontology link api", () => {
  test("puts UpdateOntologyLinkParams to /ontology/link with SUCCESS mock", () => {
    const apiSource = readSource("../src/apis/ontologyManageApi.ts");
    const typeSource = readSource("../src/types/apis/updateOntologyLinkType.ts");
    const mockSource = readSource("../src/mocks/updateOntologyLinkMock/updateOntologyLinkMock.ts");
    const barrelSource = readSource("../src/apis/index.ts");
    const typesBarrel = readSource("../src/types/index.ts");

    assert.match(apiSource, /export function putUpdateOntologyLinkInterface\(\s*payload: UpdateOntologyLinkParams,?\s*\): Promise<ApiResponse<undefined>>/);
    assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/link"/);
    assert.match(apiSource, /method:\s*"put"/);
    assert.match(apiSource, /data: payload/);
    assert.match(apiSource, /@param \{string\} payload\.uniqueIdentifier/);
    assert.match(apiSource, /@param \{string\} payload\.name/);
    assert.match(apiSource, /@param \{number\} payload\.categoryId/);
    assert.match(apiSource, /@param \{string\} payload\.description/);

    assert.match(typeSource, /export interface UpdateOntologyLinkParams/);
    assert.match(typeSource, /uniqueIdentifier:\s*string/);
    assert.match(typeSource, /name:\s*string/);
    assert.match(typeSource, /categoryId:\s*number/);
    assert.match(typeSource, /description:\s*string/);

    assert.match(mockSource, /export const updateOntologyLinkMock: ApiResponse<undefined>/);
    assert.match(mockSource, /message: "SUCCESS"/);
    assert.match(mockSource, /code: 200/);

    assert.match(barrelSource, /putUpdateOntologyLinkInterface/);
    assert.match(typesBarrel, /UpdateOntologyLinkParams/);
  });

  test("relation workspace edit puts link api then reloads workspace", () => {
    const workspaceSource = readSource("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue");
    const formSource = readSource("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationFormDialog.vue");
    assert.match(workspaceSource, /putUpdateOntologyLinkInterface/);
    assert.match(workspaceSource, /uniqueIdentifier/);
    assert.match(workspaceSource, /await loadSpaceRelationWorkspace\(\)/);
    assert.doesNotMatch(workspaceSource, /editRelationClass\(\{/);
    assert.match(formSource, /:disabled="mode === 'edit'"/);
    assert.match(formSource, /:clearable="mode !== 'edit'"/);
  });
});
