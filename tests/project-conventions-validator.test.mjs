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
  await Promise.all(
    Object.entries(files).map(async ([relativePath, content]) => {
      const filePath = path.join(root, relativePath);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, content);
    }),
  );
}

test("project convention validator checks only critical maintained surfaces", async () => {
  const scriptPath = path.resolve("scripts/check-project-conventions.mjs");
  assert.equal(await pathExists(scriptPath), true);

  const { validateProjectConventions } = await import(pathToFileURL(scriptPath).href);
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "project-conventions-"));

  try {
    await writeFixture(fixtureRoot, {
      "AGENTS.md":
        "【禁止】大模型修改、删除或提交 `public/` 中的任何文件。\n【必须】遵守 `.vscode/settings.json`。\n[Skill](.agents/skills/example/SKILL.md)\n",
      "package.json": JSON.stringify({
        scripts: {
          format: "prettier --write --ignore-unknown",
          "format:check": "prettier --check --ignore-unknown",
        },
        devDependencies: { prettier: "^3.0.0" },
      }),
      ".prettierrc.json": JSON.stringify({ tabWidth: 2, printWidth: 160, useTabs: false }),
      ".prettierignore": "html/\npublic/\n",
      ".vscode/settings.json": JSON.stringify({
        "editor.tabSize": 2,
        "editor.formatOnSave": true,
        "prettier.printWidth": 160,
        "prettier.requireConfig": true,
        "[vue]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[css]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[scss]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[javascript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[json]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[jsonc]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      }),
      ".agents/README.md": "[example](skills/example/SKILL.md)\n",
      ".agents/skills/example/SKILL.md": "---\nname: example\ndescription: Example skill.\n---\n\n# Example\n",
      ".agents/skills/example/agents/openai.yaml": 'interface:\n  default_prompt: "Use $example."\n',
      "src/styles/theme-dark.css": ":root { --aircas-color-text: #fff; }\n",
      "src/styles/theme-light.css": ":root { --aircas-color-text: #000; }\n",
      "src/styles/example.scss": ".example { color: var(--aircas-color-text); }\n",
    });

    assert.deepEqual(await validateProjectConventions(fixtureRoot), []);

    await writeFile(path.join(fixtureRoot, "src/styles/example.scss"), ".example { color: var(--aircas-color-missing); }\n");
    const errors = await validateProjectConventions(fixtureRoot);
    assert.match(errors.join("\n"), /undefined Aircas variable --aircas-color-missing/);
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test("project convention validator reports formatting configuration drift", async () => {
  const scriptPath = path.resolve("scripts/check-project-conventions.mjs");
  const { validateProjectConventions } = await import(pathToFileURL(scriptPath).href);
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "project-formatting-conventions-"));

  try {
    await writeFixture(fixtureRoot, {
      "AGENTS.md": "【禁止】大模型修改、删除或提交 `public/` 中的任何文件。\n",
      "package.json": JSON.stringify({ scripts: {}, devDependencies: {} }),
      ".prettierrc.json": JSON.stringify({ tabWidth: 4, printWidth: 80, useTabs: true }),
      ".prettierignore": "coverage/\n",
      ".vscode/settings.json": JSON.stringify({
        "editor.tabSize": 2,
        "editor.formatOnSave": false,
        "prettier.printWidth": 160,
      }),
      ".agents/README.md": "# Empty index\n",
      "src/styles/theme-dark.css": ":root {}\n",
      "src/styles/theme-light.css": ":root {}\n",
    });

    const errors = await validateProjectConventions(fixtureRoot);
    const message = errors.join("\n");
    assert.match(message, /editor\.tabSize must match Prettier tabWidth/);
    assert.match(message, /prettier\.printWidth must match Prettier printWidth/);
    assert.match(message, /editor\.formatOnSave must be enabled/);
    assert.match(message, /html\/ must be excluded from Prettier/);
    assert.match(message, /public\/ must be excluded from Prettier/);
    assert.match(message, /package\.json must provide format and format:check scripts/);
    assert.match(message, /Prettier must be a development dependency/);
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
      ".agents/skills/wrong/agents/openai.yaml": 'interface:\n  default_prompt: "No invocation."\n',
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
    await Promise.all([rm(emptyRoot, { recursive: true, force: true }), rm(invalidRoot, { recursive: true, force: true })]);
  }
});
