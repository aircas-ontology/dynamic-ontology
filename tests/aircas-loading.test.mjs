import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("aircas loading indicator sits above the existing loading copy", () => {
  const component = readSource("../src/components/AircasLoading.vue");
  const markIndex = component.indexOf('class="aircas-loading-indicator__mark"');
  const slotIndex = component.indexOf("<slot />");
  assert.ok(markIndex !== -1 && slotIndex !== -1 && markIndex < slotIndex);
  assert.match(component, /aria-hidden="true"/);
  assert.match(component, /--aircas-color-title/);
  assert.match(component, /prefers-reduced-motion:\s*reduce/);

  const register = readSource("../src/components/register.ts");
  assert.match(register, /import AircasLoading from "\.\/AircasLoading\.vue"/);
  assert.match(register, /app\.component\("AircasLoading", AircasLoading\)/);
  assert.ok(register.indexOf("AircasLoading") < register.indexOf("AircasPanel"));

  const callSites = [
    ["../src/views/OntologySpaceManagement/index.vue", "正在加载本体空间…"],
    ["../src/views/OntologySpaceManagementDetail/index.vue", "正在加载空间…"],
    ["../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue", "正在加载本体对象…"],
    ["../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue", "加载中..."],
    ["../src/views/OntologySpaceManagementDetail/components/SpaceOverviewPanel.vue", "统计加载中..."],
    ["../src/views/OntologyObjectDetail/components/AttributeCategoryTree.vue", "正在加载属性分类..."],
    ["../src/views/OntologyObjectDetail/components/AttributePropertyTable.vue", "正在加载属性..."],
  ];

  for (const [relativePath, label] of callSites) {
    const source = readSource(relativePath);
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(source, new RegExp(`<AircasLoading>\\s*${escapedLabel}\\s*</AircasLoading>`));
  }
});
