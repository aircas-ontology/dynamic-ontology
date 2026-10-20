import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

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

test("onboarding guide overlay renders step description with mock fallback and keyboard escape", () => {
  const source = readSource("../src/components/OnboardingGuide/OnboardingGuideOverlay.vue");
  assert.match(source, /<Teleport to="body">/);
  assert.match(source, /role="dialog" aria-modal="true" aria-label="新手引导"/);
  assert.match(source, /\{\{ currentStep\.description \}\}/);
  assert.match(source, /mockLabel/);
  assert.match(source, /@keydown\.esc="close"/);
  assert.match(source, /跳过/);
  assert.match(source, /上一步/);
  assert.match(source, /下一步/);
  assert.match(source, /window\.addEventListener\("resize", refreshTarget\)/);
  assert.match(source, /window\.addEventListener\("scroll", refreshTarget, true\)/);
  assert.doesNotMatch(source, /@click="currentStep\.title"/);
});

test("onboarding guide steps inline config keeps the four-step flow and filters embedded create-space", () => {
  const spaceSource = readSource("../src/views/OntologySpaceManagement/index.vue");
  for (const id of ["create-space", "create-object", "create-property", "create-relation"]) {
    assert.match(spaceSource, new RegExp(`id: "${id}"`));
  }
  assert.match(spaceSource, /isEmbedded\.value \? steps\.filter\(\(step\) => step\.id !== "create-space"\) : steps/);
  assert.match(spaceSource, /@click="guideVisible = true"/);
  assert.match(spaceSource, /:steps="guideSteps"/);
});

test("onboarding guide wires space detail and object detail pages with help entry", () => {
  const detailSource = readSource("../src/views/OntologySpaceManagementDetail/index.vue");
  assert.match(detailSource, /@click="guideVisible = true"/);
  assert.match(detailSource, /<OnboardingGuideOverlay v-model="guideVisible" :steps="guideSteps" :start-id="activeGuideStep" \/>/);
  for (const id of ["create-object", "create-property", "create-relation"]) {
    assert.match(detailSource, new RegExp(`id: "${id}"`));
  }

  const objectSource = readSource("../src/views/OntologyObjectDetail/index.vue");
  assert.match(objectSource, /@click="guideVisible = true"/);
  assert.match(objectSource, /<OnboardingGuideOverlay v-model="guideVisible" :steps="guideSteps" start-id="create-property" \/>/);
  for (const id of ["create-property", "create-relation"]) {
    assert.match(objectSource, new RegExp(`id: "${id}"`));
  }
});

test("onboarding guide overlay registers as a global component", () => {
  const source = readSource("../src/components/register.ts");
  assert.match(source, /import OnboardingGuideOverlay from "\.\/OnboardingGuide\/OnboardingGuideOverlay\.vue";/);
  assert.match(source, /app\.component\("OnboardingGuideOverlay", OnboardingGuideOverlay\);/);
});
