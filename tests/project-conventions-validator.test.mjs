import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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

async function writeFixture(root, files) {
  await Promise.all(Object.entries(files).map(async ([relativePath, content]) => {
    const filePath = path.join(root, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
  }));
}

test("project convention validator checks only critical maintained surfaces", async () => {
  const scriptPath = path.resolve("scripts/check-project-conventions.mjs");
  assert.equal(await pathExists(scriptPath), true);

  const { validateProjectConventions } = await import(pathToFileURL(scriptPath).href);
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "project-conventions-"));

  try {
    await writeFixture(fixtureRoot, {
      "AGENTS.md": "【禁止】大模型修改、删除或提交 `public/` 中的任何文件。\n[Skill](.agents/skills/example/SKILL.md)\n",
      ".agents/README.md": "[example](skills/example/SKILL.md)\n",
      ".agents/skills/example/SKILL.md": "---\nname: example\ndescription: Example skill.\n---\n\n# Example\n",
      ".agents/skills/example/agents/openai.yaml": "interface:\n  default_prompt: \"Use $example.\"\n",
      "src/styles/theme-dark.css": ":root { --aircas-color-text: #fff; }\n",
      "src/styles/theme-light.css": ":root { --aircas-color-text: #000; }\n",
      "src/styles/example.scss": ".example { color: var(--aircas-color-text); }\n",
    });

    assert.deepEqual(await validateProjectConventions(fixtureRoot), []);

    await writeFile(
      path.join(fixtureRoot, "src/styles/example.scss"),
      ".example { color: var(--aircas-color-missing); }\n",
    );
    const errors = await validateProjectConventions(fixtureRoot);
    assert.match(errors.join("\n"), /undefined Aircas variable --aircas-color-missing/);
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test("project convention validator reports missing and inconsistent critical surfaces", async () => {
  const scriptPath = path.resolve("scripts/check-project-conventions.mjs");
  const { validateProjectConventions } = await import(pathToFileURL(scriptPath).href);
  const emptyRoot = await mkdtemp(path.join(os.tmpdir(), "project-conventions-empty-"));
  const invalidRoot = await mkdtemp(path.join(os.tmpdir(), "project-conventions-invalid-"));

  try {
    const missingErrors = await validateProjectConventions(emptyRoot);
    assert.match(missingErrors.join("\n"), /AGENTS\.md is required/);
    assert.match(missingErrors.join("\n"), /\.agents\/skills is required/);
    assert.match(missingErrors.join("\n"), /src\/styles is required/);

    await writeFixture(invalidRoot, {
      "AGENTS.md": "[Missing](missing.md)\n",
      ".agents/README.md": "# Empty index\n",
      ".agents/CODEX-NAVIGATION-GUIDE.md": "obsolete\n",
      ".agents/skills/Bad_Name/placeholder.txt": "missing entrypoints\n",
      ".agents/skills/wrong/SKILL.md": "---\nname: different\n---\n\n# Wrong\n",
      ".agents/skills/wrong/agents/openai.yaml": "interface:\n  default_prompt: \"No invocation.\"\n",
      "src/styles/theme-dark.css": ":root { --aircas-color-dark-only: #000; }\n",
      "src/styles/theme-light.css": ":root {}\n",
      "src/styles/example.scss": ".example { color: var(--aircas-color-missing); }\n",
    });

    const inconsistentErrors = await validateProjectConventions(invalidRoot);
    const message = inconsistentErrors.join("\n");
    assert.match(message, /missing Markdown target/);
    assert.match(message, /invalid skill directory name/);
    assert.match(message, /must provide SKILL\.md and agents\/openai\.yaml/);
    assert.match(message, /invalid name or description frontmatter/);
    assert.match(message, /must reference \$wrong/);
    assert.match(message, /wrong is missing from \.agents\/README\.md/);
    assert.match(message, /undefined Aircas variable --aircas-color-missing/);
    assert.match(message, /--aircas-color-dark-only must be declared in both Aircas themes/);
    assert.match(message, /must prohibit models from changing public/);
    assert.match(message, /navigation guidance must be maintained in AGENTS\.md only/);
  } finally {
    await Promise.all([
      rm(emptyRoot, { recursive: true, force: true }),
      rm(invalidRoot, { recursive: true, force: true }),
    ]);
  }
});
