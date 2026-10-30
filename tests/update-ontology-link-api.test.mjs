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
  test("relation workspace edit puts link api then reloads workspace", () => {
    const workspaceSource = readSource("../src/views/SpaceRelationWorkspace/index.vue");
    const formSource = readSource("../src/views/SpaceRelationWorkspace/components/SpaceRelationFormDialog.vue");
    assert.match(workspaceSource, /putUpdateOntologyLinkInterface/);
    assert.match(workspaceSource, /uniqueIdentifier/);
    assert.match(workspaceSource, /await loadSpaceRelationWorkspace\(\)/);
    assert.doesNotMatch(workspaceSource, /editRelationClass\(\{/);
    assert.match(formSource, /:disabled="mode === 'edit'"/);
    assert.match(formSource, /label="分类" required/);
    assert.doesNotMatch(formSource, /:clearable="mode !== 'edit'"/);
  });
});
