import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

/**
 * @description 判断历史占位路径是否仍存在。
 * @param {string} filePath 仓库文件路径。
 * @returns {Promise<boolean>} 路径是否存在。
 */
async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

test("all src directory guides have no remediation chapter", async () => {
  const guidePaths = ["apis", "assets", "components", "layout", "mocks", "models", "router", "stores", "styles", "types", "utils", "views"].map((directory) =>
    path.join("src", directory, "readme.md"),
  );

  for (const guidePath of guidePaths) {
    assert.doesNotMatch(await readFile(guidePath, "utf8"), /现状差异与后续整改/, guidePath);
  }
});

test("obsolete placeholders and resource layouts are removed", async () => {
  const obsoletePaths = [
    "src/router/modules/ontologyRoutes.ts",
    "src/views/ontology/index.vue",
    "src/mocks/ontologyBuildMock/ontologyBuildMock.ts",
    "src/assets/png",
    "src/assets/svg",
    "src/views/LoginPage/assets",
  ];

  for (const obsoletePath of obsoletePaths) {
    assert.equal(await pathExists(obsoletePath), false, obsoletePath);
  }
});

test("login and common components contain no placeholder credentials or hardcoded colors", async () => {
  const loginSource = await readFile("src/views/LoginPage/index.vue", "utf8");
  const componentSources = await Promise.all([readFile("src/components/AircasPanel.vue", "utf8"), readFile("src/components/AircasTimeline.vue", "utf8")]);

  assert.doesNotMatch(loginSource, /admin|123456|setStorage|password\"\)|OntologyDomain/);
  assert.doesNotMatch(componentSources.join("\n"), /#[0-9a-f]{3,8}\b|rgba?\(|\b(?:white|black|red)\b/i);
});

test("default layout remains mounted by the workspace route", async () => {
  assert.equal(await pathExists("src/layout/index.vue"), true);
  const routeSource = await readFile("src/router/modules/workspaceRoutes.ts", "utf8");
  assert.match(routeSource, /@\/layout\/index\.vue/);
});
