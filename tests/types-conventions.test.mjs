import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateTypes } from "../scripts/check-types-conventions.mjs";

async function createFixture(files) {
  const root = await mkdtemp(path.join(os.tmpdir(), "types-conventions-"));

  for (const [file, content] of Object.entries(files)) {
    const filePath = path.join(root, file);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
  }

  return root;
}

test("accepts valid type layout, exports, and sorted index", async () => {
  const root = await createFixture({
    "src/types/apis/exampleType.ts": "export interface ExampleParams {}\n",
    "src/types/auth/loginType.ts": "export interface LoginCredentials {}\n",
    "src/types/pages/ontologyType.ts": "export interface OntologyPageType {}\n",
    "src/types/global/runtimeConfigType.ts": "declare global { const CONFIG: unknown; }\nexport {};\n",
    "src/types/index.ts": [
      'export type { ExampleParams } from "./apis/exampleType";',
      'export type { LoginCredentials } from "./auth/loginType";',
      'export type { OntologyPageType } from "./pages/ontologyType";',
      "",
    ].join("\n"),
  });

  try {
    assert.deepEqual(validateTypes(path.join(root, "src/types")), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects nested page type directories", async () => {
  const root = await createFixture({
    "src/types/pages/ontology/ontologyType.ts": "export interface OntologyPageType {}\n",
    "src/types/index.ts": "export type { OntologyPageType } from \"./pages/ontology/ontologyType\";\n",
  });

  try {
    assert.match(validateTypes(path.join(root, "src/types")).join("\n"), /must be placed inside a type category directory/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects declaration file naming", async () => {
  const root = await createFixture({
    "src/types/global/runtimeConfig.d.ts": "declare global { const CONFIG: unknown; }\nexport {};\n",
    "src/types/index.ts": "",
  });

  try {
    assert.match(validateTypes(path.join(root, "src/types")).join("\n"), /\*\.d\.ts is not allowed/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports naming, export, ordering, and bypass import violations", async () => {
  const root = await createFixture({
    "src/types/apis/example.ts": "export interface ExampleParams {}\n",
    "src/types/auth/loginType.ts": "export interface LoginCredentials {}\n",
    "src/types/auth/unexportedType.ts": "export interface UnexportedType {}\n",
    "src/types/index.ts": [
      'export type { LoginCredentials } from "./auth/loginType";',
      'export type { ExampleParams } from "./apis/example";',
      "",
    ].join("\n"),
    "src/apis/exampleApi.ts": 'import type { ExampleParams } from "@/types/apis/example";\n',
  });

  try {
    const errors = validateTypes(path.join(root, "src/types"));
    assert.equal(errors.length, 4);
    assert.match(errors.join("\n"), /must end with Type\.ts/);
    assert.match(errors.join("\n"), /is not exported from src\/types\/index\.ts/);
    assert.match(errors.join("\n"), /must be sorted/);
    assert.match(errors.join("\n"), /must import public types from @\/types/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires imports to appear before exports in index", async () => {
  const root = await createFixture({
    "src/types/auth/loginType.ts": "export interface LoginCredentials {}\n",
    "src/types/index.ts": [
      'export type { LoginCredentials } from "./auth/loginType";',
      'import type { LoginCredentials } from "./auth/loginType";',
      "",
    ].join("\n"),
  });

  try {
    assert.match(validateTypes(path.join(root, "src/types")).join("\n"), /imports must appear before exports/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
