import assert from "node:assert/strict";
import test from "node:test";

import { buildCreateOntologyExternalFunctionParams } from "../src/views/FunctionOperatorPanel/utils/buildCreateOntologyExternalFunctionParams.ts";

test("buildCreateOntologyExternalFunctionParams builds EXTERNAL payload without apiKey", () => {
  const payload = buildCreateOntologyExternalFunctionParams({
    functionApi: " httpbin-echo-test ",
    version: " 1.0.0 ",
    displayName: " httpbin回显测试 ",
    description: " 外部API简化契约测试 ",
    ontologySpaceId: 12,
    sourceVersion: "",
    endpoint: " https://httpbin.org/post ",
    method: "POST",
    authType: "none",
    apiKeyHeader: "should-not-send",
    apiKey: "should-not-send",
    inputs: [
      { name: " title ", type: "string", description: " 标题 ", location: "Body", required: "yes" },
      { name: "   ", type: "string", description: "忽略", location: "Body", required: "no" },
      { name: "content", type: "string", description: "内容", location: "Query", required: "no" },
    ],
    outputs: [
      { name: "json", type: "object", description: "回显的请求体" },
      { name: " ", type: "string", description: "忽略" },
      { name: "origin", type: "string", description: "客户端IP" },
    ],
  });

  assert.deepEqual(payload, {
    functionApi: "httpbin-echo-test",
    version: "1.0.0",
    displayName: "httpbin回显测试",
    description: "外部API简化契约测试",
    type: "EXTERNAL",
    ontologySpaceId: 12,
    basedOnOldVersion: false,
    apiConfig: {
      endpoint: "https://httpbin.org/post",
      method: "POST",
      authType: "none",
      contentType: "application/json",
      inputs: [
        { name: "title", type: "string", required: true, location: "body", description: "标题" },
        { name: "content", type: "string", required: false, location: "query", description: "内容" },
      ],
      outputs: [
        { name: "json", type: "object", description: "回显的请求体" },
        { name: "origin", type: "string", description: "客户端IP" },
      ],
    },
  });
  assert.equal("queryConfig" in payload, false);
  assert.equal("parameters" in payload, false);
  assert.equal("apiKey" in payload.apiConfig, false);
  assert.equal("apiKeyHeader" in payload.apiConfig, false);
});

test("buildCreateOntologyExternalFunctionParams sends trimmed apiKeyHeader and apiKey for API Key auth", () => {
  const payload = buildCreateOntologyExternalFunctionParams({
    functionApi: "echo",
    version: "1.0.0",
    displayName: "回显",
    description: "说明",
    ontologySpaceId: 3,
    sourceVersion: " 1.0.0 ",
    endpoint: "https://httpbin.org/post",
    method: "PUT",
    authType: "apiKey",
    apiKeyHeader: " X-Api-Key ",
    apiKey: " secret-key ",
    inputs: [
      { name: "id", type: "number", description: "编号", location: "Path", required: "yes" },
      { name: "flag", type: "boolean", description: "标记", location: "Header", required: "no" },
    ],
    outputs: [{ name: "ok", type: "array", description: "结果" }],
  });

  assert.equal(payload.basedOnOldVersion, true);
  assert.equal(payload.apiConfig.authType, "apiKey");
  assert.equal(payload.apiConfig.apiKeyHeader, "X-Api-Key");
  assert.equal(payload.apiConfig.apiKey, "secret-key");
  assert.deepEqual(payload.apiConfig.inputs, [
    { name: "id", type: "number", required: true, location: "path", description: "编号" },
    { name: "flag", type: "boolean", required: false, location: "header", description: "标记" },
  ]);
  assert.deepEqual(payload.apiConfig.outputs, [{ name: "ok", type: "array", description: "结果" }]);
});
