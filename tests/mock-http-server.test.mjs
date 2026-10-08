import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createNotFoundMockBody, matchMockRoute } from "../scripts/mock-server.mjs";

/**
 * @description 读取仓库内相对 tests 的源文件。
 * @param relativePath 相对路径。
 * @returns 文件文本。
 */
function readSource(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
}

test("mockData routes map login and space list to fixtures with login token header", () => {
  const routes = JSON.parse(readSource("../src/mockData/routes.json"));
  assert.ok(Array.isArray(routes));
  const login = routes.find((item) => item.method === "POST" && item.path === "/ontology/user/login");
  const spaceList = routes.find((item) => item.method === "GET" && item.path === "/ontology/space");
  assert.ok(login);
  assert.ok(spaceList);
  assert.equal(login.headers?.["access-token"], "mock-login-token");
  assert.equal(existsSync(new URL(`../src/mockData/${login.file}`, import.meta.url)), true);
  assert.equal(existsSync(new URL(`../src/mockData/${spaceList.file}`, import.meta.url)), true);
});

test("matchMockRoute prefers exact method and path then parameter patterns", () => {
  const routes = [
    { method: "GET", path: "/ontology/space", file: "fixtures/ontology/space.get.json" },
    { method: "GET", path: "/ontology/space/:spaceId", file: "fixtures/ontology/space/by-id.get.json" },
  ];
  assert.equal(matchMockRoute("GET", "/ontology/space", routes)?.file, "fixtures/ontology/space.get.json");
  assert.equal(matchMockRoute("GET", "/ontology/space/navy", routes)?.file, "fixtures/ontology/space/by-id.get.json");
  assert.equal(matchMockRoute("POST", "/ontology/space", routes), null);
});

test("unmatched mock routes return a standard error envelope", () => {
  const body = createNotFoundMockBody();
  assert.equal(body.success, false);
  assert.equal(body.code, 404);
  assert.equal(typeof body.message, "string");
});

test("dev script starts mock server with vite and package scripts wire both", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const devSource = readSource("../scripts/dev.mjs");
  const mockSource = readSource("../scripts/mock-server.mjs");
  assert.equal(packageJson.scripts.dev, "node scripts/dev.mjs");
  assert.equal(packageJson.scripts.mock, "node scripts/mock-server.mjs");
  assert.equal(packageJson.scripts["mock:record"], "node scripts/record-mock-from-api.mjs");
  assert.match(devSource, /mock-server\.mjs/);
  assert.match(devSource, /vite/);
  assert.match(mockSource, /37003/);
});
