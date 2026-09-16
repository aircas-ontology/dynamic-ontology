import assert from "node:assert/strict";
import { AxiosHeaders } from "axios";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { authorizeRequest, normalizeRequestError, rejectResponse, RequestError, resolveResponseData } from "../src/utils/request.ts";
import { clearLoginToken, getAuthorizationHeader, saveLoginToken } from "../src/utils/authToken.ts";

function createSessionStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function withFakeSessionStorage(run) {
  const originalWindow = globalThis.window;
  const storage = createSessionStorage();
  globalThis.window = { sessionStorage: storage };

  try {
    return run(storage);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
}

test("request errors use a safe typed contract and delegate auth to the token module", async () => {
  const source = await readFile("src/utils/request.ts", "utf8");

  assert.match(source, /export class RequestError extends Error/);
  assert.doesNotMatch(source, /getStorage|localStorage|sessionStorage|console\.(?:log|error)/);
  assert.match(source, /getAuthorizationHeader/);
  assert.match(source, /clearLoginToken/);
  assert.match(source, /axios\.isAxiosError/);
});

test("request error normalization hides server payloads and preserves safe status context", () => {
  const notFoundError = normalizeRequestError({
    isAxiosError: true,
    response: { data: { message: "sensitive server detail" }, status: 404 },
  });
  const timeoutError = normalizeRequestError({ isAxiosError: true, code: "ECONNABORTED" });
  const networkError = normalizeRequestError({ isAxiosError: true });
  const unknownError = normalizeRequestError(new Error("internal detail"));

  assert.ok(notFoundError instanceof RequestError);
  assert.equal(notFoundError.status, 404);
  assert.equal(notFoundError.message, "请求资源未找到");
  assert.doesNotMatch(notFoundError.message, /sensitive server detail/);
  assert.equal(timeoutError.message, "请求超时，请稍后重试。");
  assert.equal(networkError.message, "网络连接失败，请检查网络后重试。");
  assert.equal(unknownError.message, "请求失败，请稍后重试。");
});

test("request interceptor injects the Bearer token only when authenticated", () => {
  withFakeSessionStorage(() => {
    const unauthenticatedHeaders = new AxiosHeaders();
    authorizeRequest({ headers: unauthenticatedHeaders });
    assert.equal(unauthenticatedHeaders.get("Authorization"), undefined);

    saveLoginToken("Bearer abc.token");
    const authenticatedHeaders = new AxiosHeaders();
    authorizeRequest({ headers: authenticatedHeaders });
    assert.equal(authenticatedHeaders.get("Authorization"), "Bearer abc.token");
  });
});

test("response interceptor keeps the full response only when requested", () => {
  const fullResponse = { config: { resolveFullResponse: true }, data: { code: 200 }, headers: {} };
  assert.equal(resolveResponseData(fullResponse), fullResponse);

  const flatResponse = { config: {}, data: { code: 200, message: "ok" } };
  assert.deepEqual(resolveResponseData(flatResponse), { code: 200, message: "ok" });
});

test("401 responses clear the token while other statuses keep it", () => {
  withFakeSessionStorage(() => {
    saveLoginToken("abc.token");

    assert.throws(
      () => rejectResponse({ isAxiosError: true, response: { status: 401 } }),
      (error) => error instanceof RequestError && error.status === 401,
    );
    assert.equal(getAuthorizationHeader(), null);

    saveLoginToken("abc.token");
    assert.throws(
      () => rejectResponse({ isAxiosError: true, response: { status: 404 } }),
      (error) => error instanceof RequestError && error.status === 404,
    );
    assert.equal(getAuthorizationHeader(), "Bearer abc.token");
    clearLoginToken();
  });
});
