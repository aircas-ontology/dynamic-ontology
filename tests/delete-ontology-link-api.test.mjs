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
  test("relation workspace delete calls link api then reloads for table and graph", () => {
    const workspaceSource = readSource("../src/views/SpaceRelationWorkspace/index.vue");
    assert.match(workspaceSource, /@delete="openRelationDelete"/);
    assert.match(workspaceSource, /openRelationDelete\(asRelation\(scope\.row\)\)/);
    assert.match(workspaceSource, /deleteOntologyLinkInterface/);
    assert.match(workspaceSource, /linkUniqIdentifier/);
    assert.match(workspaceSource, /deleteOntologyLinkInterface\(\{\s*linkUniqIdentifier\s*\}\)/);
    assert.match(workspaceSource, /await loadSpaceRelationWorkspace\(\)/);
    assert.doesNotMatch(workspaceSource, /deleteRelationClass\(activeRelation\.value\.id\)/);
  });
});
