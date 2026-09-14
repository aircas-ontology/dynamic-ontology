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
