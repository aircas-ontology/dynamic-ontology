import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SKIPPED_DIRECTORIES = new Set([".git", "html", "node_modules", "public"]);
const AIRCAS_SOURCE_PATTERN = /\.(?:css|scss|vue)$/;

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(directory) {
  if (!await pathExists(directory)) return [];

  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.flatMap((entry) => {
    if (entry.isDirectory() && SKIPPED_DIRECTORIES.has(entry.name)) return [];

    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? [listFiles(entryPath)] : [[entryPath]];
  }));

  return nestedFiles.flat(2);
}

function relativePath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function markdownTargets(source) {
  return [...source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1].trim());
}

async function checkMarkdownLinks(root, errors) {
  const markdownFiles = (await listFiles(root)).filter((filePath) => filePath.endsWith(".md"));

  for (const filePath of markdownFiles) {
    const source = await readFile(filePath, "utf8");
    for (const rawTarget of markdownTargets(source)) {
      let target = rawTarget.startsWith("<") && rawTarget.endsWith(">")
        ? rawTarget.slice(1, -1)
        : rawTarget;
      if (/^(?:https?:|mailto:|#)/.test(target)) continue;

      target = decodeURIComponent(target.split("#")[0]);
      if (!target) continue;

      const resolvedTarget = path.resolve(path.dirname(filePath), target);
      if (!await pathExists(resolvedTarget)) {
        errors.push(`${relativePath(root, filePath)} has missing Markdown target ${rawTarget}.`);
      }
    }
  }
}

async function checkSkills(root, errors) {
  const skillsRoot = path.join(root, ".agents/skills");
  const indexPath = path.join(root, ".agents/README.md");
  if (!await pathExists(skillsRoot)) {
    errors.push(".agents/skills is required.");
    return;
  }
  if (!await pathExists(indexPath)) {
    errors.push(".agents/README.md is required.");
    return;
  }

  const indexSource = await readFile(indexPath, "utf8");
  const entries = await readdir(skillsRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillName = entry.name;
    const skillPath = path.join(skillsRoot, skillName, "SKILL.md");
    const metadataPath = path.join(skillsRoot, skillName, "agents/openai.yaml");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName)) {
      errors.push(`${relativePath(root, path.join(skillsRoot, skillName))} has an invalid skill directory name.`);
    }
    if (!await pathExists(skillPath) || !await pathExists(metadataPath)) {
      errors.push(`${skillName} must provide SKILL.md and agents/openai.yaml.`);
      continue;
    }

    const skillSource = await readFile(skillPath, "utf8");
    const metadataSource = await readFile(metadataPath, "utf8");
    const frontmatter = skillSource.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const declaredName = frontmatter?.[1].match(/^name:\s*(.+)$/m)?.[1].trim();
    const description = frontmatter?.[1].match(/^description:\s*(.+)$/m)?.[1].trim();
    if (declaredName !== skillName || !description) {
      errors.push(`${skillName} has invalid name or description frontmatter.`);
    }
    if (!metadataSource.includes(`$${skillName}`)) {
      errors.push(`${skillName} agents/openai.yaml must reference $${skillName}.`);
    }
    if (!indexSource.includes(`skills/${skillName}/SKILL.md`)) {
      errors.push(`${skillName} is missing from .agents/README.md.`);
    }
  }
}

function declaredAircasVariables(source) {
  return new Set([...source.matchAll(/(--aircas-[\w-]+)\s*:/g)].map((match) => match[1]));
}

async function checkAircasVariables(root, errors) {
  const stylesRoot = path.join(root, "src/styles");
  if (!await pathExists(stylesRoot)) {
    errors.push("src/styles is required.");
    return;
  }

  const sourceFiles = (await listFiles(path.join(root, "src"))).filter((filePath) =>
    AIRCAS_SOURCE_PATTERN.test(filePath),
  );
  const sources = await Promise.all(sourceFiles.map(async (filePath) => ({
    filePath,
    source: await readFile(filePath, "utf8"),
  })));
  const declaredVariables = new Set(sources.flatMap(({ source }) => [...declaredAircasVariables(source)]));

  for (const { filePath, source } of sources) {
    for (const match of source.matchAll(/var\(\s*(--aircas-[\w-]+)/g)) {
      if (!declaredVariables.has(match[1])) {
        errors.push(`${relativePath(root, filePath)} uses undefined Aircas variable ${match[1]}.`);
      }
    }
  }

  const darkThemePath = path.join(stylesRoot, "theme-dark.css");
  const lightThemePath = path.join(stylesRoot, "theme-light.css");
  if (!await pathExists(darkThemePath) || !await pathExists(lightThemePath)) {
    errors.push("Both Aircas theme files are required.");
    return;
  }

  const darkVariables = declaredAircasVariables(await readFile(darkThemePath, "utf8"));
  const lightVariables = declaredAircasVariables(await readFile(lightThemePath, "utf8"));
  for (const variable of new Set([...darkVariables, ...lightVariables])) {
    if (!darkVariables.has(variable) || !lightVariables.has(variable)) {
      errors.push(`${variable} must be declared in both Aircas themes.`);
    }
  }
}

async function checkRootPolicy(root, errors) {
  const agentsPath = path.join(root, "AGENTS.md");
  if (!await pathExists(agentsPath)) {
    errors.push("AGENTS.md is required.");
    return;
  }

  const source = await readFile(agentsPath, "utf8");
  if (!/【禁止】大模型修改、删除或提交 `public\/`/.test(source)) {
    errors.push("AGENTS.md must prohibit models from changing public/.");
  }
  if (await pathExists(path.join(root, ".agents/CODEX-NAVIGATION-GUIDE.md"))) {
    errors.push("Codex navigation guidance must be maintained in AGENTS.md only.");
  }
}

export async function validateProjectConventions(root = process.cwd()) {
  const errors = [];
  await checkMarkdownLinks(root, errors);
  await checkSkills(root, errors);
  await checkAircasVariables(root, errors);
  await checkRootPolicy(root, errors);
  return errors.sort((left, right) => left.localeCompare(right));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = await validateProjectConventions(path.resolve(process.argv[2] ?? "."));
  if (errors.length > 0) {
    console.error("Project conventions check failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Project conventions check passed.");
  }
}
