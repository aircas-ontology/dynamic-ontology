import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { ontologyGlobalSearchMock } from "../src/mocks/ontologyGlobalSearchMock/ontologyGlobalSearchMock.ts";
import {
  resolveOntologyGlobalSearchObjectRoute,
  resolveOntologyGlobalSearchPropertyRoute,
  resolveOntologyGlobalSearchRoute,
} from "../src/utils/ontologyGlobalSearchRoute.ts";

/**
 * @description 读取相对 tests 的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("global search api posts keyword and optional sizs to manage domain search uri", () => {
  const source = readSource("../src/apis/ontologySearchApi.ts");
  assert.match(source, /export function postOntologyGlobalSearchInterface\(/);
  assert.match(source, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL\s*\+\s*["']\/ontology\/search\/global["']/);
  assert.match(source, /method:\s*["']post["']/);
  assert.match(source, /data:\s*params/);
  assert.match(source, /sizs/);
});

test("global search types and api are exported from public barrels", () => {
  const types = readSource("../src/types/index.ts");
  assert.match(types, /ontologyGlobalSearchType/);
  assert.match(types, /OntologyGlobalSearchParams/);
  assert.match(types, /OntologyGlobalSearchItem/);

  const typeSource = readSource("../src/types/apis/ontologyGlobalSearchType.ts");
  assert.match(typeSource, /spaceName\?:/);
  assert.match(typeSource, /uniqueIdentifier\?:/);
  assert.match(typeSource, /ontologyUniqueIdentifier\?:/);
  assert.match(typeSource, /ontologyName\?:/);

  const apis = readSource("../src/apis/index.ts");
  assert.match(apis, /postOntologyGlobalSearchInterface/);
});

test("global search mock mirrors the documented success sample", () => {
  assert.equal(ontologyGlobalSearchMock.code, 200);
  assert.equal(ontologyGlobalSearchMock.message, "SUCCESS");
  assert.equal(ontologyGlobalSearchMock.success, true);
  assert.ok(Array.isArray(ontologyGlobalSearchMock.data));
  assert.ok(ontologyGlobalSearchMock.data.some((item) => item.type === "空间" && item.spaceId === 37));
  assert.ok(ontologyGlobalSearchMock.data.some((item) => item.type === "对象" && item.spaceId === 11 && item.spaceName && item.uniqueIdentifier && item.name));
  assert.ok(
    ontologyGlobalSearchMock.data.some(
      (item) => item.type === "属性" && item.spaceId === 46 && item.spaceName && item.ontologyName && item.ontologyUniqueIdentifier,
    ),
  );
  assert.ok(ontologyGlobalSearchMock.data.some((item) => item.type === "关系分组" && item.spaceId === 11 && item.spaceName));
});

test("resolveOntologyGlobalSearchRoute maps space and relation-group types", () => {
  assert.deepEqual(resolveOntologyGlobalSearchRoute({ name: "sj测试", type: "空间", spaceId: 37 }), {
    name: "OntologySpaceManagementDetailOverview",
    params: { spaceId: "37" },
  });
  assert.equal(resolveOntologyGlobalSearchRoute({ name: "对象A", type: "对象", spaceId: 11, objectId: 9 }), null);
  assert.deepEqual(resolveOntologyGlobalSearchRoute({ name: "a", type: "关系分组", spaceId: 11 }), {
    name: "OntologySpaceManagementDetailRelation",
    params: { spaceId: "11" },
  });
  assert.equal(resolveOntologyGlobalSearchRoute({ name: "飞机id", type: "属性", spaceId: 46, objectId: 106 }), null);
});

test("resolveOntologyGlobalSearchObjectRoute uses item uniqueIdentifier spaceName and name", () => {
  assert.deepEqual(
    resolveOntologyGlobalSearchObjectRoute({
      name: "测试本体对象-修改",
      type: "对象",
      spaceId: 11,
      spaceName: "测试空间",
      uniqueIdentifier: "ae6cca59ced9432189da4af315554957",
    }),
    {
      name: "OntologyObjectDetailObject",
      params: { objectId: "ae6cca59ced9432189da4af315554957" },
      query: { spaceId: "11", spaceName: "测试空间", objectName: "测试本体对象-修改" },
    },
  );
  assert.equal(resolveOntologyGlobalSearchObjectRoute({ name: "缺字段", type: "对象", spaceId: 11 }), null);
});

test("resolveOntologyGlobalSearchPropertyRoute uses item ontologyUniqueIdentifier spaceName and ontologyName", () => {
  assert.deepEqual(
    resolveOntologyGlobalSearchPropertyRoute({
      name: "飞机id",
      type: "属性",
      spaceId: 11,
      spaceName: "测试-rwl",
      ontologyName: "飞机",
      ontologyUniqueIdentifier: "246ef68e87524c33911b92af900700f9",
    }),
    {
      name: "OntologyObjectDetailAttribute",
      params: { objectId: "246ef68e87524c33911b92af900700f9" },
      query: { spaceId: "11", spaceName: "测试-rwl", objectName: "飞机" },
    },
  );
  assert.equal(resolveOntologyGlobalSearchPropertyRoute({ name: "缺字段", type: "属性", spaceId: 11 }), null);
});

test("global search click handler navigates object and property without meta api", () => {
  const source = readSource("../src/composables/ontology/useOntologyGlobalSearch.ts");
  assert.doesNotMatch(source, /getOntologyMetaByObjectIdInterface/);
  assert.match(source, /resolveOntologyGlobalSearchObjectRoute/);
  assert.match(source, /resolveOntologyGlobalSearchPropertyRoute/);
  assert.match(source, /item\.type === "对象"/);
  assert.match(source, /item\.type === "属性"/);
});

test("full text search page and header wire OntologyGlobalSearchField", () => {
  const page = readSource("../src/views/FullTextSearch/index.vue");
  const header = readSource("../src/layout/components/HeaderBar.vue");
  const field = readSource("../src/components/OntologyGlobalSearchField/OntologyGlobalSearchField.vue");
  const resultList = readSource("../src/components/OntologyGlobalSearchField/OntologyGlobalSearchResultList.vue");
  assert.match(page, /OntologyGlobalSearchField/);
  assert.match(page, /placement=["']page["']/);
  assert.match(header, /OntologyGlobalSearchField/);
  assert.match(header, /placement=["']overlay["']/);
  assert.doesNotMatch(header, /全局搜索暂未开放/);
  assert.match(field, /v-if="placement === ['"]page['"]"/);
  assert.match(field, /@click="submitSearch"/);
  assert.match(field, />检索<\/el-button>/);
  assert.match(resultList, /class="aircas-tag"/);
  assert.match(resultList, /item\.spaceName/);
  assert.match(resultList, /item\.ontologyName/);
  assert.match(resultList, /关系分组/);
});
