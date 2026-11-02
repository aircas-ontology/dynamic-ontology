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
  test("relation workspace create posts link api then reloads workspace", () => {
    const workspaceSource = readSource("../src/views/SpaceRelationWorkspace/index.vue");
    assert.match(workspaceSource, /postCreateOntologyLinkInterface/);
    assert.match(workspaceSource, /ontologyUniqueIdentifierFrom/);
    assert.match(workspaceSource, /ontologyUniqueIdentifierTo/);
    assert.match(workspaceSource, /await loadSpaceRelationWorkspace\(\)/);
    assert.doesNotMatch(workspaceSource, /createRelationClass\(\{/);
  });
});
