import assert from "node:assert/strict";
import { test } from "node:test";

import { mapProbeInterfaceToExternalApiFormParams } from "../src/utils/mapProbeInterfaceToExternalApiForm.ts";

test("mapProbeInterfaceToExternalApiFormParams maps integer location nested fields and method", () => {
  const mapped = mapProbeInterfaceToExternalApiFormParams({
    name: "createStudent",
    api: "POST /api/v1/students",
    method: "post",
    path: "/api/v1/students",
    description: "创建学生",
    inputParameters: [
      {
        name: "operator",
        in: "query",
        required: false,
        type: "string",
        description: "操作人",
      },
      {
        name: "student",
        in: "BODY",
        required: true,
        type: "object",
        description: "学生对象",
        fields: [
          { name: "id", in: "body", required: false, type: "integer", description: "主键" },
          { name: "name", in: "body", required: true, type: "string", description: "姓名" },
          { name: "unknown", in: "body", required: false, type: "binary", description: "跳过" },
        ],
      },
    ],
    outputParameters: [
      {
        name: "data",
        in: "body",
        required: false,
        type: "object",
        description: "响应",
        fields: [{ name: "code", in: "body", required: false, type: "integer", description: "状态码" }],
      },
    ],
  });

  assert.equal(mapped.method, "POST");
  assert.deepEqual(mapped.inputs, [
    {
      name: "operator",
      type: "string",
      description: "操作人",
      location: "Query",
      required: "no",
    },
    {
      name: "student",
      type: "object",
      description: "学生对象",
      location: "Body",
      required: "yes",
      fields: [
        { name: "id", type: "number", description: "主键" },
        { name: "name", type: "string", description: "姓名" },
      ],
    },
  ]);
  assert.deepEqual(mapped.outputs, [
    {
      name: "data",
      type: "object",
      description: "响应",
      fields: [{ name: "code", type: "number", description: "状态码" }],
    },
  ]);
});

test("mapProbeInterfaceToExternalApiFormParams falls unknown location to Body and unknown method to null", () => {
  const mapped = mapProbeInterfaceToExternalApiFormParams({
    name: "ping",
    api: "PATCH /ping",
    method: "PATCH",
    path: "/ping",
    description: "",
    inputParameters: [{ name: "token", in: "cookie", required: true, type: "string", description: "" }],
    outputParameters: [],
  });
  assert.equal(mapped.method, null);
  assert.deepEqual(mapped.inputs, [
    {
      name: "token",
      type: "string",
      description: "",
      location: "Body",
      required: "yes",
    },
  ]);
  assert.deepEqual(mapped.outputs, []);
});
