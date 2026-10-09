import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveServiceRequestUrl } from "../src/utils/resolveServiceRequestUrl.ts";

const realLogin = "http://172.16.18.58:37002";
const realManage = "http://172.16.18.58:37002";
const mockServer = "http://127.0.0.1:37003";

test("resolveServiceRequestUrl rewrites login and ontology hosts only when USE_MOCK is on", () => {
  const config = {
    USE_MOCK: true,
    MOCK_SERVER_URL: mockServer,
    LOGIN_URL: realLogin,
    ONTOLOGYMANAGE_URL: realManage,
  };

  assert.equal(resolveServiceRequestUrl(`${realLogin}/ontology/user/login`, config), `${mockServer}/ontology/user/login`);
  assert.equal(resolveServiceRequestUrl(`${realManage}/ontology/space?page=1`, config), `${mockServer}/ontology/space?page=1`);
  assert.equal(resolveServiceRequestUrl("http://192.168.53.45:5000/example", config), "http://192.168.53.45:5000/example");
});

test("resolveServiceRequestUrl keeps the original url when mock switch is off or incomplete", () => {
  const url = `${realManage}/ontology/space`;
  assert.equal(resolveServiceRequestUrl(url, { USE_MOCK: false, MOCK_SERVER_URL: mockServer, ONTOLOGYMANAGE_URL: realManage }), url);
  assert.equal(resolveServiceRequestUrl(url, { USE_MOCK: true, MOCK_SERVER_URL: "", ONTOLOGYMANAGE_URL: realManage }), url);
  assert.equal(resolveServiceRequestUrl("/ontology/space", { USE_MOCK: true, MOCK_SERVER_URL: mockServer }), "/ontology/space");
});

test("request interceptor applies mock host rewrite before sending", async () => {
  const source = await readFile("src/utils/request.ts", "utf8");
  assert.match(source, /resolveServiceRequestUrl/);
  assert.match(source, /applyMockServiceUrl|USE_MOCK/);
});
