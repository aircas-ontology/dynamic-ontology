import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { mapOntologyFunctionQueryConfigToBasicFilter, stringifyBasicFilterConfig } from "../src/utils/functionOperatorBasicFilter.ts";
import {
  mapOntologyExternalApiConfigToForm,
  mapOntologyFunctionDetailToDraft,
  mapOntologyFunctionDetailToOperator,
} from "../src/utils/mapOntologyFunctionDetail.ts";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("get ontology function detail types expose documented fields", () => {
  const source = readSource("../src/types/apis/getOntologyFunctionDetailType.ts");
  assert.match(source, /export interface GetOntologyFunctionDetailParams/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /version: string/);
  assert.match(source, /export interface GetOntologyFunctionDetailData/);
  assert.match(source, /displayName: string/);
  assert.match(source, /description: string/);
  assert.match(source, /model: string/);
  assert.match(source, /type: string/);
  assert.match(source, /ontologySpaceId: number/);
  assert.match(source, /params: GetOntologyFunctionDetailParamItem\[\]/);
  assert.match(source, /fields\?: GetOntologyFunctionDetailParamItem\[\]/);
  assert.match(source, /code: string/);
  assert.match(source, /language\?: string/);
  assert.match(source, /publishStatus\?: number/);
  assert.match(source, /description\?: string/);
  assert.match(source, /queryConfig\?: CreateOntologyFunctionQueryConfig/);
  assert.match(source, /apiConfig\?: CreateOntologyFunctionApiConfig/);
  assert.match(source, /compositeConfig\?: OntologyCompositeConfig/);
  assert.match(source, /rateLimitTemplateId\?: number/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /GetOntologyFunctionDetailData/);
  assert.match(barrel, /getOntologyFunctionDetailType/);
  assert.match(barrel, /FunctionOperatorCodeDefinition/);
  assert.match(barrel, /OntologyCompositeConfig/);
  const draftType = readSource("../src/types/pages/ontologyFunctionOperatorType.ts");
  assert.match(draftType, /compositeConfig\?: OntologyCompositeConfig/);
  assert.match(draftType, /rateLimitTemplateId\?: number/);
});

test("get ontology function detail api gets detail by functionApi query", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /getOntologyFunctionDetailInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/detail"/);
  assert.match(source, /method: "get"/);
  assert.match(source, /params/);
  assert.match(source, /params\.version/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /getOntologyFunctionDetailInterface/);
});

test("mapOntologyFunctionQueryConfigToBasicFilter maps dataType to valueType", () => {
  const doc = mapOntologyFunctionQueryConfigToBasicFilter({
    filters: {
      logic: "AND",
      children: [
        {
          type: "FILTER",
          filter: { propertyApiName: "age", op: "EQ", value: "10", dataType: "STRING" },
        },
        {
          type: "FILTER",
          filter: { propertyApiName: "amount", op: "GT", value: 100, dataType: "NUMBER" },
        },
      ],
    },
    aggFunc: "SUM",
  });
  assert.equal(doc.logic, "AND");
  assert.equal(doc.children[0]?.filter?.valueType, "string");
  assert.equal(doc.children[0]?.filter?.value, "10");
  assert.equal(doc.children[1]?.filter?.valueType, "number");
  assert.equal(doc.children[1]?.filter?.value, 100);
  assert.match(stringifyBasicFilterConfig(doc), /"propertyApiName": "age"/);
});

test("mapOntologyFunctionQueryConfigToBasicFilter keeps empty children when filters missing", () => {
  const doc = mapOntologyFunctionQueryConfigToBasicFilter({
    aggFunc: "SUM",
    targetProperty: "oooo",
  });
  assert.equal(doc.logic, "AND");
  assert.equal(doc.children.length, 0);
  assert.doesNotMatch(stringifyBasicFilterConfig(doc), /"type": "FILTER"/);
});

test("mapOntologyFunctionDetailToDraft omits empty filter row when queryConfig has no filters", () => {
  const draft = mapOntologyFunctionDetailToDraft(
    {
      functionApi: "s",
      displayName: "s",
      description: "s",
      model: "BASIC",
      type: "BASIC_QUERY",
      ontologySpaceId: 46,
      version: "1.0.0",
      params: [],
      code: "{}",
      queryConfig: {
        aggFunc: "SUM",
        targetProperty: "oooo",
      },
    },
    46,
  );
  assert.equal(draft.definition.kind, "basic");
  if (draft.definition.kind === "basic") {
    assert.equal(draft.definition.aggFunc, "SUM");
    assert.equal(draft.definition.targetProperty, "oooo");
    assert.doesNotMatch(draft.definition.parameterConfig, /"type": "FILTER"/);
    assert.match(draft.definition.parameterConfig, /"children": \[\]/);
  }
});

test("mapOntologyFunctionDetailToDraft fills basic form fields from detail", () => {
  const draft = mapOntologyFunctionDetailToDraft(
    {
      functionApi: "ss",
      displayName: "ss",
      description: "ss",
      model: "BASIC",
      type: "BASIC_QUERY",
      ontologySpaceId: 46,
      version: "1.2.3",
      params: [],
      code: "{}",
      queryConfig: {
        aggFunc: "SUM",
        targetProperty: "age",
        filters: {
          logic: "AND",
          children: [{ type: "FILTER", filter: { propertyApiName: "age", op: "EQ", value: "10", dataType: "STRING" } }],
        },
      },
    },
    46,
  );
  assert.equal(draft.name, "ss");
  assert.equal(draft.functionApi, "ss");
  assert.equal(draft.description, "ss");
  assert.equal(draft.version, "1.2.3");
  assert.equal(draft.type, "basic");
  assert.equal(draft.definition.kind, "basic");
  assert.equal("rateLimitTemplateId" in draft, false);
  if (draft.definition.kind === "basic") {
    assert.equal(draft.definition.aggFunc, "SUM");
    assert.equal(draft.definition.targetProperty, "age");
    assert.match(draft.definition.parameterConfig, /"propertyApiName": "age"/);
  }
});

test("mapOntologyFunctionDetailToDraft keeps rateLimitTemplateId when detail provides it", () => {
  const draft = mapOntologyFunctionDetailToDraft(
    {
      functionApi: "ss",
      displayName: "ss",
      description: "ss",
      model: "BASIC",
      type: "BASIC_QUERY",
      ontologySpaceId: 46,
      version: "1.0.0",
      params: [],
      code: "{}",
      rateLimitTemplateId: 7,
    },
    46,
  );
  assert.equal(draft.rateLimitTemplateId, 7);
});

test("mapOntologyFunctionDetailToDraft falls back to list version when detail omits version", () => {
  const draft = mapOntologyFunctionDetailToDraft(
    {
      functionApi: "ss",
      displayName: "ss",
      description: "ss",
      model: "BASIC",
      type: "BASIC_QUERY",
      ontologySpaceId: 46,
      params: [],
      code: "{}",
    },
    46,
    "2.0.0",
  );
  assert.equal(draft.version, "2.0.0");
});

test("mapOntologyFunctionDetailToDraft fills script code and language from CUSTOMIZE detail", () => {
  const scriptCode =
    "interface User {\n  id: number;\n  name: string;\n}\n\nexport function handle(input: User): Output {\n    return {\n        id:input.id+1,\n        name1:input.name+'a',\n    }\n}\n";
  const draft = mapOntologyFunctionDetailToDraft(
    {
      functionApi: "jbtest",
      version: "1.0.1",
      publishStatus: 0,
      displayName: "脚本函数cesi",
      description: "jbtest 1.0.1",
      model: "OTHER",
      type: "CUSTOMIZE",
      language: "TYPESCRIPT",
      ontologySpaceId: 1,
      params: [
        { paramId: 1122, paramName: "id", paramType: "DOUBLE", category: "INPUT", paramOrder: 1 },
        { paramId: 1123, paramName: "name", paramType: "STRING", category: "INPUT", paramOrder: 2 },
      ],
      code: scriptCode,
    },
    1,
  );
  assert.equal(draft.type, "code");
  assert.equal(draft.name, "脚本函数cesi");
  assert.equal(draft.functionApi, "jbtest");
  assert.equal(draft.version, "1.0.1");
  assert.equal(draft.protocol, "HTTP");
  assert.equal(draft.definition.kind, "code");
  if (draft.definition.kind === "code") {
    assert.equal(draft.definition.language, "typescript");
    assert.equal(draft.definition.code, scriptCode);
    assert.match(draft.definition.code, /export function handle/);
  }
  assert.equal(draft.inputParameters.length, 2);
  assert.equal(draft.inputParameters[0]?.name, "id");
  assert.equal(draft.inputParameters[0]?.apiParamType, "DOUBLE");
  assert.equal(draft.inputParameters[1]?.name, "name");
  assert.equal(draft.outputParameters.length, 0);
});

test("function operator openEdit fetches detail before opening form", () => {
  const workspace = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  assert.match(workspace, /getOntologyFunctionDetailInterface/);
  assert.match(workspace, /mapOntologyFunctionDetailToDraft/);
  assert.match(workspace, /async function openEdit/);
  assert.match(workspace, /formDraft\.value\s*=/);
  assert.match(workspace, /formVisible\.value\s*=\s*true/);
  assert.match(workspace, /getOntologyFunctionDetailInterface\(\{\s*functionApi,\s*version,?\s*\}\)/);
  assert.match(workspace, /缺少函数版本/);
  assert.match(workspace, /mapOntologyFunctionDetailToDraft\([\s\S]*operator\.version/);
  const openEditBlock = workspace.slice(workspace.indexOf("async function openEdit"), workspace.indexOf("async function saveOperator"));
  assert.ok(
    openEditBlock.indexOf("formVisible.value = true") < openEditBlock.indexOf("getOntologyFunctionDetailInterface"),
    "formVisible must open before detail request",
  );
  assert.match(openEditBlock, /version/);
});

test("mapOntologyFunctionDetailToOperator fills input params from detail", () => {
  const operator = mapOntologyFunctionDetailToOperator(
    {
      functionApi: "ss",
      displayName: "ss",
      description: "ss",
      model: "BASIC",
      type: "BASIC_QUERY",
      ontologySpaceId: 46,
      params: [
        {
          paramId: 25,
          paramName: "xingbie",
          paramType: "STRING",
          category: "INPUT",
          paramOrder: 1,
          description: "过滤条件",
          paramRole: "FILTER",
        },
        {
          paramId: 27,
          paramName: "target",
          paramType: "STRING",
          category: "INPUT",
          paramOrder: 3,
          description: "聚合目标",
          paramRole: "AGGREGATION",
        },
      ],
      version: "1.0.0",
      code: "{}",
      queryConfig: {
        filters: {
          logic: "AND",
          children: [{ type: "FILTER", filter: { propertyApiName: "age", op: "EQ", value: "10", dataType: "STRING" } }],
        },
      },
    },
    {
      id: "ss",
      spaceId: 46,
      name: "列表名",
      functionApi: "ss",
      description: "",
      type: "basic",
      apiModelType: "BASIC_QUERY",
      protocol: "",
      version: "9.9.9",
      createdBy: "",
      updatedAt: "2026-09-24 11:35:18",
      status: "",
      category: "",
      inputParameters: [],
      outputParameters: [],
      timeout: 0,
      retryCount: 0,
      retryInterval: 0,
      definition: { kind: "basic", parameterConfig: "" },
      dependencies: [],
      testStatus: "untested",
      testedAt: "",
      versions: [],
    },
  );
  assert.equal(operator.name, "ss");
  assert.equal(operator.version, "1.0.0");
  assert.equal(operator.updatedAt, "2026-09-24 11:35:18");
  assert.equal(operator.inputParameters.length, 2);
  assert.equal(operator.inputParameters[0]?.name, "xingbie");
  assert.match(operator.inputParameters[0]?.description ?? "", /FILTER/);
  assert.equal(operator.outputParameters.length, 0);
  assert.equal(operator.definition.kind, "basic");
  if (operator.definition.kind === "basic") {
    assert.match(operator.definition.parameterConfig, /"propertyApiName": "age"/);
  }
});

test("mapOntologyFunctionDetailToOperator maps publishStatus to status", () => {
  const draftOperator = mapOntologyFunctionDetailToOperator({
    functionApi: "jbtest",
    displayName: "脚本函数cesi",
    description: "jbtest 1.0.1",
    model: "OTHER",
    type: "CUSTOMIZE",
    language: "TYPESCRIPT",
    ontologySpaceId: 1,
    version: "1.0.1",
    publishStatus: 0,
    params: [],
    code: "",
  });
  assert.equal(draftOperator.status, "draft");
  const publishedOperator = mapOntologyFunctionDetailToOperator({
    functionApi: "jbtest",
    displayName: "脚本函数cesi",
    description: "jbtest 1.0.1",
    model: "OTHER",
    type: "CUSTOMIZE",
    language: "TYPESCRIPT",
    ontologySpaceId: 1,
    version: "1.0.2",
    publishStatus: 1,
    params: [],
    code: "",
  });
  assert.equal(publishedOperator.status, "published");
});

test("mapOntologyFunctionDetailToOperator splits params by INPUT and OUTPUT category", () => {
  const operator = mapOntologyFunctionDetailToOperator({
    functionApi: "jbtest",
    displayName: "脚本函数cesi",
    description: "jbtest 1.0.1",
    model: "OTHER",
    type: "CUSTOMIZE",
    language: "TYPESCRIPT",
    ontologySpaceId: 1,
    version: "1.0.1",
    params: [
      { paramId: 1122, paramName: "id", paramType: "DOUBLE", category: "INPUT", paramOrder: 1 },
      { paramId: 1123, paramName: "name", paramType: "STRING", category: "input", paramOrder: 2 },
      { paramId: 1124, paramName: "id", paramType: "DOUBLE", category: "OUTPUT", paramOrder: 1 },
      { paramId: 1125, paramName: "name1", paramType: "STRING", category: "OUTPUT", paramOrder: 2 },
      { paramId: 9999, paramName: "ignored", paramType: "STRING", category: "OTHER", paramOrder: 1 },
    ],
    code: "export function handle() {}",
  });
  assert.equal(operator.inputParameters.length, 2);
  assert.equal(operator.inputParameters[0]?.name, "id");
  assert.equal(operator.inputParameters[1]?.name, "name");
  assert.equal(operator.outputParameters.length, 2);
  assert.equal(operator.outputParameters[0]?.name, "id");
  assert.equal(operator.outputParameters[1]?.name, "name1");
});

test("mapOntologyFunctionDetailToOperator preserves nested fields and apiParamType", () => {
  const operator = mapOntologyFunctionDetailToOperator({
    functionApi: "nested.fn",
    displayName: "nested",
    description: "nested",
    model: "OTHER",
    type: "CUSTOMIZE",
    language: "TYPESCRIPT",
    ontologySpaceId: 1,
    version: "1.0.0",
    params: [
      {
        paramId: 1,
        paramName: "input",
        paramType: "OBJECT",
        category: "INPUT",
        paramOrder: 1,
        fields: [
          {
            paramName: "b",
            paramType: "LIST",
            category: "INPUT",
            paramOrder: 2,
          },
          {
            paramName: "a",
            paramType: "OBJECT",
            category: "INPUT",
            paramOrder: 1,
            fields: [
              { paramName: "aa", paramType: "STRING", category: "INPUT", paramOrder: 1 },
              { paramName: "data", paramType: "STRING", category: "INPUT", paramOrder: 2 },
            ],
          },
        ],
      },
      {
        paramId: 2,
        paramName: "Output",
        paramType: "OBJECT",
        category: "OUTPUT",
        paramOrder: 1,
        fields: [{ paramName: "id", paramType: "DOUBLE", category: "OUTPUT", paramOrder: 1 }],
      },
    ],
    code: "",
  });
  assert.equal(operator.inputParameters.length, 1);
  assert.equal(operator.inputParameters[0]?.apiParamType, "OBJECT");
  assert.equal(operator.inputParameters[0]?.itemFields?.length, 2);
  assert.equal(operator.inputParameters[0]?.itemFields?.[0]?.name, "a");
  assert.equal(operator.inputParameters[0]?.itemFields?.[0]?.apiParamType, "OBJECT");
  assert.equal(operator.inputParameters[0]?.itemFields?.[0]?.itemFields?.[0]?.name, "aa");
  assert.equal(operator.inputParameters[0]?.itemFields?.[1]?.name, "b");
  assert.equal(operator.inputParameters[0]?.itemFields?.[1]?.apiParamType, "LIST");
  assert.equal(operator.outputParameters[0]?.itemFields?.[0]?.apiParamType, "DOUBLE");
});

test("mapOntologyFunctionDetailToOperator falls back to list version when detail omits version", () => {
  const operator = mapOntologyFunctionDetailToOperator(
    {
      functionApi: "ss",
      displayName: "ss",
      description: "ss",
      model: "BASIC",
      type: "BASIC_QUERY",
      ontologySpaceId: 46,
      params: [],
      code: "{}",
    },
    {
      id: "ss",
      spaceId: 46,
      name: "列表名",
      functionApi: "ss",
      description: "",
      type: "basic",
      apiModelType: "BASIC_QUERY",
      protocol: "",
      version: "3.1.0",
      createdBy: "",
      updatedAt: "",
      status: "",
      category: "",
      inputParameters: [],
      outputParameters: [],
      timeout: 0,
      retryCount: 0,
      retryInterval: 0,
      definition: { kind: "basic", parameterConfig: "" },
      dependencies: [],
      testStatus: "untested",
      testedAt: "",
      versions: [],
    },
  );
  assert.equal(operator.version, "3.1.0");
});

test("function operator openDetail fetches detail for drawer", () => {
  const workspace = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  const drawer = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorDetailDrawer.vue");
  const panel = readSource("../src/views/FunctionOperatorPanel/index.vue");
  assert.match(workspace, /async function openDetail/);
  assert.match(workspace, /mapOntologyFunctionDetailToOperator/);
  assert.match(workspace, /detailLoading/);
  assert.match(workspace, /getOntologyFunctionVersionsInterface/);
  assert.match(workspace, /async function changeDetailVersion/);
  assert.match(workspace, /detailVersions/);
  assert.match(workspace, /detailVersion/);
  assert.doesNotMatch(drawer, /showOutputParameters/);
  assert.match(drawer, /definition\.kind !== ['"]basic['"]/);
  assert.match(drawer, /输入参数/);
  assert.match(drawer, /输出参数/);
  assert.match(drawer, /FunctionOperatorScriptParamTree/);
  assert.match(drawer, /mapOperatorParametersToScriptParamTree/);
  const paramTree = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptParamTree.vue");
  assert.match(paramTree, /item\.description/);
  assert.match(paramTree, /function-operator-script-param-tree__description/);
  const parseType = readSource("../src/types/apis/parseOntologyFunctionParamsType.ts");
  assert.match(parseType, /description\?: string/);
  assert.doesNotMatch(drawer, /el-table/);
  assert.match(drawer, /props\.operator\?\.inputParameters/);
  assert.match(drawer, /props\.operator\?\.outputParameters/);
  assert.match(drawer, /el-select/);
  assert.match(drawer, /change-version/);
  assert.match(drawer, /typeLabel\(operator\)[\s\S]*operator\.status/);
  assert.match(drawer, /function-operator-detail__actions/);
  assert.match(drawer, /emit\(["']edit["']\)/);
  assert.match(drawer, /emit\(["']toggle-publish["']\)/);
  assert.match(drawer, /emit\(["']delete["']\)/);
  assert.match(drawer, /emit\(["']test["']\)/);
  assert.match(drawer, />编辑</);
  assert.match(drawer, /下线|发布/);
  assert.match(drawer, />删除</);
  assert.match(drawer, />测试</);
  assert.match(drawer, /definition\.kind === ["']code["']/);
  assert.match(drawer, /scriptCodeSectionTitle/);
  assert.match(drawer, /scriptCodeText/);
  assert.match(drawer, /definition\.code/);
  assert.match(drawer, /loading/);
  assert.doesNotMatch(drawer, /必填/);
  assert.match(panel, /@change-version=["']changeDetailVersion["']/);
  assert.match(panel, /:detail-version=["']detailVersion["']/);
  assert.match(panel, /@edit=["']onDetailEdit["']/);
  assert.match(panel, /@toggle-publish=["']onDetailTogglePublish["']/);
  assert.match(panel, /@delete=["']onDetailDelete["']/);
  assert.match(panel, /@test=["']onDetailTest["']/);
  assert.match(panel, /function onDetailEdit/);
  assert.match(panel, /function onDetailTest/);
  assert.match(panel, /openEdit\(selectedOperator\.value\)/);
  assert.match(panel, /togglePublish\(selectedOperator\.value\)/);
  assert.match(panel, /openDeleteOperator\(selectedOperator\.value\)/);
  assert.match(panel, /openTest\(selectedOperator\.value\)/);
});

test("mapOntologyFunctionDetailToDraft keeps compositeConfig for workflow echo", () => {
  const compositeConfig = {
    kind: "COMPOSITE",
    nodes: [{ id: "n1", kind: "function", functionId: "fn.a", functionVersion: "1.0.0", label: "编排A" }],
    edges: [],
    inputMappings: [],
    outputMappings: [],
    inputParameters: [],
    outputParameters: [],
    graph: { nodes: [{ id: "n1" }], edges: [] },
  };
  const draft = mapOntologyFunctionDetailToDraft(
    {
      functionApi: "comp.a",
      version: "1.0.0",
      displayName: "编排A",
      description: "说明",
      model: "OTHER",
      type: "COMPOSITE",
      ontologySpaceId: 7,
      params: [],
      code: "",
      compositeConfig,
    },
    7,
  );
  assert.equal(draft.type, "composite");
  assert.deepEqual(draft.compositeConfig, compositeConfig);
});

test("mapOntologyFunctionDetailToDraft keeps external apiConfig for form echo", () => {
  const apiConfig = {
    endpoint: " https://service.example/run ",
    method: "PUT",
    authType: "apiKey",
    contentType: "application/json",
    apiKeyHeader: " X-Api-Key ",
    apiKey: " secret ",
    inputs: [
      { name: "q", type: "string", required: true, location: "query", description: "关键词" },
      { name: "bad-type", type: "date", required: true, location: "body", description: "" },
      { name: "bad-location", type: "string", required: false, location: "cookie", description: "" },
    ],
    outputs: [
      { name: "id", type: "number", description: "编号" },
      { name: "bad", type: "date", description: "" },
    ],
  };
  const draft = mapOntologyFunctionDetailToDraft(
    {
      functionApi: "ext.demo",
      version: "1.0.0",
      displayName: "外部接口",
      description: "说明",
      model: "OTHER",
      type: "EXTERNAL",
      ontologySpaceId: 3,
      params: [],
      code: "",
      apiConfig,
    },
    3,
  );
  assert.equal(draft.type, "api");
  assert.equal(draft.name, "外部接口");
  assert.deepEqual(draft.externalApiConfig, apiConfig);
  const formValues = mapOntologyExternalApiConfigToForm(apiConfig);
  assert.equal(formValues.endpoint, "https://service.example/run");
  assert.equal(formValues.method, "PUT");
  assert.equal(formValues.authType, "apiKey");
  assert.equal(formValues.apiKeyHeader, "X-Api-Key");
  assert.equal(formValues.apiKey, "secret");
  assert.deepEqual(formValues.inputs, [{ name: "q", type: "string", description: "关键词", location: "Query", required: "yes" }]);
  assert.deepEqual(formValues.outputs, [{ name: "id", type: "number", description: "编号" }]);
  const noneValues = mapOntologyExternalApiConfigToForm({
    endpoint: "https://service.example/run",
    method: "POST",
    authType: "none",
    contentType: "application/json",
    apiKeyHeader: "ignored",
    apiKey: "ignored",
    inputs: [],
    outputs: [],
  });
  assert.equal(noneValues.apiKeyHeader, "");
  assert.equal(noneValues.apiKey, "");
  assert.equal(mapOntologyExternalApiConfigToForm(undefined), null);
  const echoed = mapOntologyExternalApiConfigToForm(
    {
      endpoint: "https://httpbin.org/post",
      method: "POST",
      authType: "none",
      contentType: "application/json",
      inputs: [],
      outputs: [],
    },
    {
      inputs: [{ id: "in-1", name: "title", type: "string", required: false, description: "标题" }],
      outputs: [
        { id: "out-1", name: "result", type: "object", required: false, description: "响应报文" },
        { id: "out-2", name: "status", type: "number", required: false, description: "HTTP 状态码" },
      ],
    },
  );
  assert.equal(echoed.endpoint, "https://httpbin.org/post");
  assert.deepEqual(echoed.inputs, [{ name: "title", type: "string", description: "标题", location: "Body", required: "no" }]);
  assert.deepEqual(echoed.outputs, [
    { name: "result", type: "object", description: "响应报文" },
    { name: "status", type: "number", description: "HTTP 状态码" },
  ]);
  const detailDraft = mapOntologyFunctionDetailToDraft(
    {
      functionApi: "wb",
      version: "1.0.0",
      displayName: "外部测试",
      description: "wb",
      model: "OTHER",
      type: "EXTERNAL",
      ontologySpaceId: 1,
      params: [
        { paramId: 1334, paramName: "result", paramType: "OBJECT", category: "OUTPUT", paramOrder: 1, description: "响应报文" },
        { paramId: 1335, paramName: "status", paramType: "DOUBLE", category: "OUTPUT", paramOrder: 2, description: "HTTP 状态码" },
        { paramId: 1336, paramName: "title", paramType: "STRING", category: "INPUT", paramOrder: 1, description: "标题" },
      ],
      code: "",
      apiConfig: {
        endpoint: "https://httpbin.org/post",
        method: "POST",
        authType: "none",
        contentType: "application/json",
        inputs: [],
        outputs: [],
      },
    },
    1,
  );
  const detailForm = mapOntologyExternalApiConfigToForm(detailDraft.externalApiConfig, {
    inputs: detailDraft.inputParameters,
    outputs: detailDraft.outputParameters,
  });
  assert.deepEqual(detailForm.outputs, [
    { name: "result", type: "object", description: "响应报文" },
    { name: "status", type: "number", description: "HTTP 状态码" },
  ]);
  assert.deepEqual(detailForm.inputs, [{ name: "title", type: "string", description: "标题", location: "Body", required: "no" }]);
  const nestedForm = mapOntologyExternalApiConfigToForm({
    endpoint: "https://example.com/nested",
    method: "POST",
    authType: "none",
    contentType: "application/json",
    inputs: [
      {
        name: "payload",
        type: "object",
        required: true,
        location: "body",
        description: "请求体",
        fields: [
          { name: "title", type: "string", description: "标题" },
          {
            name: "meta",
            type: "object",
            description: "元数据",
            fields: [{ name: "count", type: "integer", description: "数量" }],
          },
        ],
      },
    ],
    outputs: [
      {
        name: "data",
        type: "object",
        description: "响应",
        fields: [{ name: "id", type: "number", description: "编号" }],
      },
    ],
  });
  assert.deepEqual(nestedForm.inputs, [
    {
      name: "payload",
      type: "object",
      description: "请求体",
      location: "Body",
      required: "yes",
      fields: [
        { name: "title", type: "string", description: "标题" },
        {
          name: "meta",
          type: "object",
          description: "元数据",
          fields: [{ name: "count", type: "number", description: "数量" }],
        },
      ],
    },
  ]);
  assert.deepEqual(nestedForm.outputs, [
    {
      name: "data",
      type: "object",
      description: "响应",
      fields: [{ name: "id", type: "number", description: "编号" }],
    },
  ]);
  const formSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue");
  const fieldsEditorSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorExternalApiParamFieldsEditor.vue");
  assert.match(formSource, /mapOntologyExternalApiConfigToForm/);
  assert.match(formSource, /FunctionOperatorExternalApiParamFieldsEditor/);
  assert.match(formSource, /onExternalApiParameterTypeChange/);
  assert.match(formSource, /validateExternalApiNestedFields/);
  assert.match(fieldsEditorSource, /添加属性/);
});
