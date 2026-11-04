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

describe("delete ontology action api", () => {
  test("api uses DELETE /ontology/action with ontologySpaceId and actionApi query params", () => {
    const apiSource = readSource("../src/apis/ontologyActionApi.ts");
    assert.match(apiSource, /deleteOntologyActionInterface/);
    assert.match(apiSource, /method: "delete"/);
    assert.match(apiSource, /url: DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/action"/);
    assert.match(apiSource, /params,/);
  });

  test("behavior workspace delete calls action api then reloads list", () => {
    const composableSource = readSource("../src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts");
    assert.match(composableSource, /deleteOntologyActionInterface/);
    assert.match(composableSource, /ontologySpaceId: currentSpaceId/);
    assert.match(composableSource, /actionApi/);
    assert.match(composableSource, /await loadSpaceBehaviorList\(\)/);
    assert.doesNotMatch(composableSource, /deleteSpaceBehaviorMock/);
  });
});
