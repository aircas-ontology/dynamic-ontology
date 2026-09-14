import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { build } from "vite";

export async function createVerificationBuildConfig() {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "dynamic-ontology-build-"));

  return {
    build: {
      emptyOutDir: true,
      outDir,
    },
  };
}

async function runVerificationBuild() {
  const config = await createVerificationBuildConfig();
  await build(config);
  console.log(`Verification build output: ${config.build.outDir}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runVerificationBuild();
}
