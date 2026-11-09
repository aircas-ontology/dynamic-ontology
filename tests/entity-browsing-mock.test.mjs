import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { matchMockRoute } from "../scripts/mock-server.mjs";
import { ENTITY_BROWSING_DEFAULT_SPACE_ID } from "../src/utils/entityBrowseConstants.ts";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("entity browsing default space appears in mock space list fixture", () => {
  const fixture = JSON.parse(readSource("../src/mockData/fixtures/ontology/space.get.json"));
  const spaces = fixture.data;
  assert.ok(Array.isArray(spaces));
  const target = spaces.find((item) => String(item.spaceId) === ENTITY_BROWSING_DEFAULT_SPACE_ID);
  assert.ok(target);
  assert.equal(target.displayName, "战场情报领域");
});

test("entity browsing category tree mock exposes object cards for browse UI", () => {
  const fixture = JSON.parse(readSource("../src/mockData/fixtures/ontology/category/tree.get.json"));
  const root = fixture.data;
  assert.equal(root.name, "全部");
  const destroyers = root.children?.find((node) => node.name === "舰船")?.children?.find((node) => node.name === "驱逐舰");
  assert.ok(destroyers);
  assert.ok((destroyers.ontologyMetaInfos?.length ?? 0) >= 2);
  assert.equal(destroyers.ontologyMetaInfos[0].spaceId, Number(ENTITY_BROWSING_DEFAULT_SPACE_ID));
});

test("mock routes still match space list and category tree used by entity browsing", () => {
  const routes = JSON.parse(readSource("../src/mockData/routes.json"));
  assert.equal(matchMockRoute("GET", "/ontology/space", routes)?.file, "fixtures/ontology/space.get.json");
  assert.equal(matchMockRoute("GET", "/ontology/category/tree", routes)?.file, "fixtures/ontology/category/tree.get.json");
  assert.equal(matchMockRoute("GET", "/ontology/space/statistic", routes)?.file, "fixtures/ontology/space/statistic.get.json");
});
