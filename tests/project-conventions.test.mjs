import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

test("toolchain constraints require Node 24, npm 11, and Chrome 130", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(await pathExists(".npmrc"), true);

  const npmConfig = await readFile(".npmrc", "utf8");
  const viteConfig = await readFile("vite.config.ts", "utf8");

  assert.equal(packageJson.engines.node, ">=24.12.0");
  assert.equal(packageJson.engines.npm, ">=11.0.0");
  assert.equal(packageJson.packageManager, "npm@11.17.0");
  assert.equal(packageJson.scripts["build:verify"], "node scripts/verify-build.mjs");
  assert.match(npmConfig, /^engine-strict=true$/m);
  assert.match(viteConfig, /target:\s*["']chrome130["']/);
});

test("editor and CLI formatting configuration stay aligned", async () => {
  assert.equal(await pathExists(".prettierrc.json"), true);
  assert.equal(await pathExists(".prettierignore"), true);

  const editorSettings = JSON.parse(await readFile(".vscode/settings.json", "utf8"));
  const prettierConfig = JSON.parse(await readFile(".prettierrc.json", "utf8"));
  const prettierIgnore = await readFile(".prettierignore", "utf8");

  assert.equal(editorSettings["editor.tabSize"], prettierConfig.tabWidth);
  assert.equal(editorSettings["prettier.printWidth"], prettierConfig.printWidth);
  assert.equal(editorSettings["editor.formatOnSave"], true);
  assert.equal(editorSettings["prettier.requireConfig"], true);
  assert.equal(prettierConfig.useTabs, false);
  assert.match(prettierIgnore, /^html\/$/m);
  assert.match(prettierIgnore, /^public\/$/m);
});

test("package scripts format only explicitly supplied paths", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(packageJson.scripts.format, "prettier --write --ignore-unknown");
  assert.equal(packageJson.scripts["format:check"], "prettier --check --ignore-unknown");
  assert.equal(typeof packageJson.devDependencies.prettier, "string");
});

test("project formatting skill uses repository configuration and scoped paths", async () => {
  const skillPath = ".agents/skills/code-formatting/SKILL.md";
  assert.equal(await pathExists(skillPath), true);

  const skillSource = await readFile(skillPath, "utf8");
  const agentsSource = await readFile("AGENTS.md", "utf8");

  assert.match(skillSource, /\.vscode\/settings\.json/);
  assert.match(skillSource, /\.prettierrc\.json/);
  assert.match(skillSource, /当前任务.*文件/s);
  assert.match(skillSource, /html\//);
  assert.match(skillSource, /public\//);
  assert.match(agentsSource, /【必须】.*\.vscode\/settings\.json/s);
});

test("all components in src/components are globally registered", async () => {
  const registerSource = await readFile("src/components/register.ts", "utf8");

  assert.match(registerSource, /import AircasPanel from "\.\/AircasPanel\.vue"/);
  assert.match(registerSource, /import AircasTimeline from "\.\/AircasTimeline\.vue"/);
  assert.match(registerSource, /app\.component\("AircasPanel", AircasPanel\)/);
  assert.match(registerSource, /app\.component\("AircasTimeline", AircasTimeline\)/);
});

test("ApiResponse is owned and exported by src/types", async () => {
  const responseTypePath = "src/types/apis/apiResponseType.ts";
  assert.equal(await pathExists(responseTypePath), true);

  const responseTypeSource = await readFile(responseTypePath, "utf8");
  const typesIndexSource = await readFile("src/types/index.ts", "utf8");
  const requestSource = await readFile("src/utils/request.ts", "utf8");
  const exampleApiSource = await readFile("src/apis/exampleApi.ts", "utf8");

  assert.match(responseTypeSource, /export interface ApiResponse<T = unknown>/);
  assert.match(typesIndexSource, /export type \{ ApiResponse \} from "\.\/apis\/apiResponseType"/);
  assert.match(requestSource, /import type \{ ApiResponse \} from "@\/types"/);
  assert.doesNotMatch(requestSource, /interface ApiResponse/);
  assert.match(exampleApiSource, /import type \{ ApiResponse, ExampleData, ExampleParams \} from "@\/types"/);
  assert.doesNotMatch(exampleApiSource, /type ApiResponse.*@\/utils\/request/);
});

test("runtime domain configuration has a global type declaration", async () => {
  const runtimeConfigSource = await readFile("src/types/global/runtimeConfigType.ts", "utf8");

  assert.match(runtimeConfigSource, /interface DomainConfig/);
  assert.match(runtimeConfigSource, /const DOMAIN_CONFIG: DomainConfig/);
});

test("verification builds use a fresh operating-system temporary directory", async () => {
  const scriptPath = path.resolve("scripts/verify-build.mjs");
  assert.equal(await pathExists(scriptPath), true);

  const { createVerificationBuildConfig } = await import(pathToFileURL(scriptPath).href);
  const config = await createVerificationBuildConfig();
  const relativeToTemp = path.relative(os.tmpdir(), config.build.outDir);
  const relativeToProject = path.relative(process.cwd(), config.build.outDir);

  assert.equal(config.build.emptyOutDir, true);
  assert.equal(relativeToTemp.startsWith(".."), false);
  assert.equal(path.isAbsolute(relativeToTemp), false);
  assert.equal(relativeToProject.startsWith(".."), true);
});

test("developer prompts and plans are not ignored", async () => {
  const gitignore = await readFile(".gitignore", "utf8");

  assert.doesNotMatch(gitignore, /^docs\/?$/m);
  assert.doesNotMatch(gitignore, /^plans\/?$/m);
});

test("root rules own navigation and prohibit model changes to public", async () => {
  const agentsSource = await readFile("AGENTS.md", "utf8");

  assert.equal(await pathExists(".agents/CODEX-NAVIGATION-GUIDE.md"), false);
  assert.match(agentsSource, /【禁止】大模型.*修改.*删除.*提交.*public\//s);
  assert.doesNotMatch(agentsSource, /CODEX-NAVIGATION-GUIDE/);
});

test("router rules keep login and fallback routes as index exceptions", async () => {
  const routerGuide = await readFile("src/router/readme.md", "utf8");

  assert.match(routerGuide, /登录入口.*兜底路由.*index\.ts/s);
});

test("login exposes command states and blocks repeated submission", async () => {
  const loginSource = await readFile("src/views/LoginPage/index.vue", "utf8");

  assert.match(loginSource, /"idle"\s*\|\s*"submitting"\s*\|\s*"success"\s*\|\s*"error"/);
  assert.match(loginSource, /:disabled="loginStatus === 'submitting'"/);
  assert.match(loginSource, /if \(loginStatus\.value === "submitting"\) return/);
  assert.match(loginSource, /role="alert"/);
});

test("drawer uses only defined public shadow variables", async () => {
  const drawerSource = await readFile("src/styles/element-plus/el-drawer.scss", "utf8");

  assert.doesNotMatch(drawerSource, /--aircas-shadow-default/);
  assert.match(drawerSource, /--el-box-shadow-light/);
});

test("API implementation skill remains a single-contract orchestrator", async () => {
  const skillSource = await readFile(".agents/skills/backend-api-implementation/SKILL.md", "utf8");

  assert.doesNotMatch(skillSource, /CODEX-NAVIGATION-GUIDE/);
  assert.match(skillSource, /单份 Api\.md/);
  assert.match(skillSource, /src\/apis\/readme\.md/);
  assert.match(skillSource, /不得自行补造/);
});
