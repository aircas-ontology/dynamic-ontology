import assert from "node:assert/strict";
import { test } from "node:test";
import { splitParsedScriptParameters } from "../src/views/FunctionOperatorPanel/utils/splitParsedScriptParameters.ts";

const nestedParameters = [
  {
    paramName: "age",
    paramType: "DOUBLE",
    category: "INPUT",
    paramOrder: 2,
    referenceType: "",
  },
  {
    paramName: "input",
    paramType: "OBJECT",
    category: "INPUT",
    paramOrder: 1,
    referenceType: "",
    fields: [
      {
        paramName: "b",
        paramType: "LIST",
        category: "INPUT",
        paramOrder: 2,
        referenceType: "",
        fields: [],
      },
      {
        paramName: "a",
        paramType: "OBJECT",
        category: "INPUT",
        paramOrder: 1,
        referenceType: "",
        fields: [
          {
            paramName: "data",
            paramType: "STRING",
            category: "INPUT",
            paramOrder: 2,
            referenceType: "",
          },
          {
            paramName: "aa",
            paramType: "OBJECT",
            category: "INPUT",
            paramOrder: 1,
            referenceType: "",
          },
        ],
      },
    ],
  },
  {
    paramName: "ignored",
    paramType: "STRING",
    category: "META",
    paramOrder: 1,
    referenceType: "",
  },
  {
    paramName: "Output",
    paramType: "OBJECT",
    category: "OUTPUT",
    paramOrder: 1,
    referenceType: "",
    fields: [
      {
        paramName: "name",
        paramType: "STRING",
        category: "OUTPUT",
        paramOrder: 2,
        referenceType: "",
      },
      {
        paramName: "id",
        paramType: "DOUBLE",
        category: "OUTPUT",
        paramOrder: 1,
        referenceType: "",
      },
    ],
  },
];

test("splitParsedScriptParameters groups nested input and output trees by order", () => {
  const split = splitParsedScriptParameters(nestedParameters);
  assert.deepEqual(
    split.inputParameters.map((item) => item.paramName),
    ["input", "age"],
  );
  assert.deepEqual(
    split.inputParameters[0].fields.map((item) => item.paramName),
    ["a", "b"],
  );
  assert.equal(split.inputParameters[0].fields[1].fields, undefined);
  assert.deepEqual(
    split.inputParameters[0].fields[0].fields.map((item) => item.paramName),
    ["aa", "data"],
  );
  assert.deepEqual(
    split.outputParameters[0].fields.map((item) => item.paramName),
    ["id", "name"],
  );
  assert.equal(
    split.inputParameters.some((item) => item.paramName === "ignored"),
    false,
  );
});
