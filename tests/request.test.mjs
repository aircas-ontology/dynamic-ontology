import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { normalizeRequestError, RequestError } from "../src/utils/request.ts";

test("request errors use a safe typed contract without storage-backed authorization", async () => {
  const source = await readFile("src/utils/request.ts", "utf8");

  assert.match(source, /export class RequestError extends Error/);
  assert.doesNotMatch(source, /getStorage|localStorage|Authorization|console\.(?:log|error)/);
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
