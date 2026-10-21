import assert from "node:assert/strict";
import { test } from "node:test";
import { mapOperatorParametersToScriptParamTree } from "../src/views/FunctionOperatorPanel/utils/mapOperatorParametersToScriptParamTree.ts";

test("mapOperatorParametersToScriptParamTree passes non-empty description and omits blank", () => {
  const nodes = mapOperatorParametersToScriptParamTree(
    [
      {
        id: "in-1",
        name: "arg0",
        type: "string",
        required: false,
        description: " 入参说明 ",
        apiParamType: "STRING",
      },
      {
        id: "in-2",
        name: "flag",
        type: "boolean",
        required: false,
        description: "   ",
        apiParamType: "BOOLEAN",
        itemFields: [
          {
            id: "in-2-a",
            name: "nested",
            type: "string",
            required: false,
            description: "子属性说明",
            apiParamType: "STRING",
          },
        ],
      },
    ],
    "INPUT",
  );
  assert.equal(nodes[0]?.description, "入参说明");
  assert.equal("description" in (nodes[1] ?? {}), false);
  assert.equal(nodes[1]?.fields?.[0]?.description, "子属性说明");
});

test("mapOperatorParametersToScriptParamTree uses apiParamType and nested itemFields", () => {
  const nodes = mapOperatorParametersToScriptParamTree(
    [
      {
        id: "1",
        name: "input",
        type: "object",
        required: false,
        description: "",
        apiParamType: "OBJECT",
        itemFields: [
          {
            id: "1-a",
            name: "a",
            type: "object",
            required: false,
            description: "",
            apiParamType: "OBJECT",
            itemFields: [{ id: "1-a-aa", name: "aa", type: "string", required: false, description: "", apiParamType: "STRING" }],
          },
          { id: "1-b", name: "b", type: "array", required: false, description: "", apiParamType: "LIST" },
        ],
      },
    ],
    "INPUT",
  );
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].paramName, "input");
  assert.equal(nodes[0].paramType, "OBJECT");
  assert.equal(nodes[0].category, "INPUT");
  assert.equal(nodes[0].fields?.[0]?.paramName, "a");
  assert.equal(nodes[0].fields?.[0]?.fields?.[0]?.paramType, "STRING");
  assert.equal(nodes[0].fields?.[1]?.paramType, "LIST");
});
