import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { extractAuthorizationHeader, persistLoginToken, postLoginInterface } from "../src/apis/loginApi.ts";
import { getAuthorizationHeader } from "../src/utils/authToken.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("login api posts credentials to the configured login domain and reads the token header", async () => {
  const source = await read("src/apis/loginApi.ts");

  assert.match(source, /export function postLoginInterface\(/);
  assert.match(source, /requestFull<LoginData>/);
  assert.match(source, /url:\s*DOMAIN_CONFIG\.LOGIN_URL\s*\+\s*["']\/ontology\/user\/login["']/);
  assert.match(source, /method:\s*["']post["']/);
  assert.match(source, /data:\s*params/);
  assert.doesNotMatch(source, /^\s*params,\s*$/m);
  assert.match(source, /persistLoginToken\(headers\)/);
  assert.equal(typeof postLoginInterface, "function");
});

test("login domain is declared in the global runtime config type", async () => {
  const source = await read("src/types/global/runtimeConfigType.ts");

  assert.match(source, /readonly LOGIN_URL:\s*string/);
});

test("login params contract requires username and password strings", async () => {
  const source = await read("src/types/apis/loginType.ts");

  assert.match(source, /export interface LoginParams\s*{\s*username:\s*string;\s*password:\s*string;\s*}/);
  assert.match(source, /export interface LoginData/);
});

test("login types and api are exposed through public barrels", async () => {
  const types = await read("src/types/index.ts");
  assert.match(types, /export type \{ LoginData, LoginParams \} from "\.\/apis\/loginType";/);

  const apis = await read("src/apis/index.ts");
  assert.match(apis, /postLoginInterface/);
});

test("login page submits through the login command, checks code 200, and routes to space management", async () => {
  const source = await read("src/views/LoginPage/index.vue");

  assert.match(source, /import \{ useLoginCommand \} from "\.\/composables\/useLoginCommand";/);
  assert.match(source, /const \{ submitLogin \} = useLoginCommand\(\);/);
  assert.match(source, /const response = await submitLogin\(formData\.value\);/);
  assert.match(source, /if \(response\.code !== 200\)/);
  assert.match(source, /name: "OntologySpaceManagement"/);
});

test("extractAuthorizationHeader reads Authorization case-insensitively and rejects non-strings", () => {
  assert.equal(extractAuthorizationHeader({ authorization: "Bearer abc.token" }), "Bearer abc.token");
  assert.equal(extractAuthorizationHeader({ Authorization: "abc.token" }), "abc.token");
  assert.equal(extractAuthorizationHeader({ authorization: "  " }), null);
  assert.equal(extractAuthorizationHeader({ authorization: 123 }), null);
  assert.equal(extractAuthorizationHeader({}), null);
});

test("persistLoginToken stores the response token and fails fast when it is missing", () => {
  const originalWindow = globalThis.window;
  const storage = {
    values: new Map(),
    getItem(key) {
      return this.values.has(key) ? this.values.get(key) : null;
    },
    setItem(key, value) {
      this.values.set(key, String(value));
    },
    removeItem(key) {
      this.values.delete(key);
    },
  };
  globalThis.window = { sessionStorage: storage };

  try {
    persistLoginHeader({ authorization: "Bearer abc.token" });
    assert.equal(getAuthorizationHeader(), "Bearer abc.token");

    storage.values.clear();
    persistLoginHeader({ Authorization: "plain.token" });
    assert.equal(getAuthorizationHeader(), "Bearer plain.token");

    assert.throws(() => persistLoginHeader({}), /令牌/);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }

  function persistLoginHeader(headers) {
    return persistLoginToken(headers);
  }
});
