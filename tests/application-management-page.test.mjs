import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { apiDocsOntologyMock } from "../src/mocks/apiDocsOntologyMock/apiDocsOntologyMock.ts";
import {
  filterApiDocsEndpointGroups,
  filterApiDocsEndpointGroupsByPath,
  matchApiDocsEndpointPath,
  mapApiDocsEndpointMenuOptions,
} from "../src/views/ApplicationManagement/utils/filterApiDocsEndpointGroups.ts";
import { mapApiDocsEndpointDetail, mapApiDocsEndpointGroups, mapApiDocsServiceInfo } from "../src/views/ApplicationManagement/utils/parseOpenApiDocument.ts";

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

test("application management route and menu are registered beside full-text search", () => {
  const routeSource = readSource("../src/router/modules/workspaceRoutes.ts");
  const menuSource = readSource("../src/layout/components/NavigationMenu.vue");
  assert.match(routeSource, /name:\s*"ApplicationManagement"/);
  assert.match(routeSource, /path:\s*"application-management"/);
  assert.match(routeSource, /ApplicationManagement\/index\.vue/);
  assert.match(menuSource, /ApplicationManagement/);
  assert.match(menuSource, /应用管理/);
});

test("parseOpenApiDocument maps mock document into groups and lemma detail", () => {
  const serviceInfo = mapApiDocsServiceInfo(apiDocsOntologyMock);
  assert.equal(serviceInfo.title, "本体服务");
  assert.equal(serviceInfo.openapi, "3.1.0");
  assert.match(serviceInfo.serverUrl, /\/ontology$/);

  const groups = mapApiDocsEndpointGroups(apiDocsOntologyMock);
  assert.ok(groups.length > 0);
  const lemmaGroup = groups.find((group) => group.tag === "本体百科词条");
  assert.ok(lemmaGroup);
  assert.ok(lemmaGroup.endpoints.some((item) => item.method === "get" && item.path === "/lemma"));

  const detail = mapApiDocsEndpointDetail(apiDocsOntologyMock, "get", "/lemma");
  assert.ok(detail);
  assert.equal(detail.summary, "查询词条详情");
  assert.equal(detail.operationId, "OntologyLemmaController_queryLemmaById");
  assert.equal(detail.parameters.length, 1);
  assert.equal(detail.parameters[0]?.name, "lemmaId");
  assert.equal(detail.parameters[0]?.location, "query");
  assert.equal(detail.parameters[0]?.required, true);
  assert.ok(detail.responses.some((row) => row.status === "200"));
});

test("parseOpenApiDocument maps requestBody schema properties into parameter rows", () => {
  const detail = mapApiDocsEndpointDetail(apiDocsOntologyMock, "post", "/link");
  assert.ok(detail);
  assert.equal(detail.summary, "创建本体之间的关系");
  assert.ok(detail.parameters.length >= 6);
  const nameRow = detail.parameters.find((row) => row.name === "name");
  assert.ok(nameRow);
  assert.equal(nameRow.location, "body");
  assert.equal(nameRow.required, true);
  assert.match(nameRow.description, /本体关系名称/);
  const spaceIdRow = detail.parameters.find((row) => row.name === "spaceId");
  assert.ok(spaceIdRow);
  assert.equal(spaceIdRow.typeLabel, "integer(int32)");
  assert.equal(spaceIdRow.required, true);
  const categoryIdRow = detail.parameters.find((row) => row.name === "categoryId");
  assert.ok(categoryIdRow);
  assert.equal(categoryIdRow.required, false);
});

test("parseOpenApiDocument maps response schema fields for get space", () => {
  const detail = mapApiDocsEndpointDetail(apiDocsOntologyMock, "get", "/space");
  assert.ok(detail);
  assert.equal(detail.responses.length, 1);
  const ok = detail.responses[0];
  assert.ok(ok);
  assert.equal(ok.status, "200");
  assert.equal(ok.schemaLabel, "RestResultListOntologySpaceVO");
  assert.ok(ok.schemaFields.some((field) => field.name === "code"));
  const dataField = ok.schemaFields.find((field) => field.name === "data");
  assert.ok(dataField);
  assert.match(dataField.typeLabel, /array/);
  assert.ok(dataField.children?.some((field) => field.name === "spaceId" && field.path === "data[].spaceId"));
  assert.ok(dataField.children?.some((field) => field.name === "displayName" && field.path === "data[].displayName"));
});

test("filterApiDocsEndpointGroupsByPath fuzzy-matches endpoint paths", () => {
  const groups = mapApiDocsEndpointGroups(apiDocsOntologyMock);
  assert.equal(matchApiDocsEndpointPath("/link/by_ontology", "link"), true);
  assert.equal(matchApiDocsEndpointPath("/link/by_ontology", "lbo"), true);
  assert.equal(matchApiDocsEndpointPath("/space", "lemma"), false);

  const filtered = filterApiDocsEndpointGroupsByPath(groups, "/link");
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((group) => group.endpoints.every((item) => matchApiDocsEndpointPath(item.path, "/link"))));
  assert.equal(filterApiDocsEndpointGroupsByPath(groups, "___no_match___").length, 0);
});

test("filterApiDocsEndpointGroups supports menu tag dropdown filter", () => {
  const groups = mapApiDocsEndpointGroups(apiDocsOntologyMock);
  const menus = mapApiDocsEndpointMenuOptions(groups);
  assert.ok(menus.includes("本体关系管理"));
  const byMenu = filterApiDocsEndpointGroups(groups, "本体关系管理", "");
  assert.equal(byMenu.length, 1);
  assert.equal(byMenu[0]?.tag, "本体关系管理");
  const byMenuAndPath = filterApiDocsEndpointGroups(groups, "本体关系管理", "/link");
  assert.ok(byMenuAndPath.length === 1);
  assert.ok(byMenuAndPath[0]?.endpoints.every((item) => matchApiDocsEndpointPath(item.path, "/link")));
});

test("application management page wires api docs composable and panels", () => {
  const pageSource = readSource("../src/views/ApplicationManagement/index.vue");
  const composableSource = readSource("../src/views/ApplicationManagement/composables/useApplicationApiDocs.ts");
  const listSource = readSource("../src/views/ApplicationManagement/components/ApiDocsEndpointList.vue");
  assert.match(pageSource, /useApplicationApiDocs/);
  assert.match(pageSource, /ApiDocsEndpointList/);
  assert.match(pageSource, /ApiDocsEndpointDetail/);
  assert.match(composableSource, /getOntologyApiDocsInterface/);
  assert.match(composableSource, /apiDocsOntologyMock/);
  assert.match(listSource, /toggleGroupExpanded/);
  assert.match(listSource, /aria-expanded/);
  assert.match(listSource, /filterApiDocsEndpointGroups/);
  assert.match(listSource, /按接口地址搜索/);
  assert.match(listSource, /按接口菜单筛选/);
  assert.match(listSource, /mapApiDocsEndpointMenuOptions/);
});
