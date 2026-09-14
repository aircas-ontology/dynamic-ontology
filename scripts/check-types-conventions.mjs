import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const TYPE_FILE_PATTERN = /^[a-z][a-zA-Z0-9]*Type\.ts$/;
const RESERVED_TOP_LEVEL_DIRECTORIES = new Set(["apis", "pages", "shared", "global"]);

function listFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

function relativePath(filePath, root) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function exportedNames(source) {
  const names = [];
  const declarationPattern = /export\s+(?:interface|type|enum|class|const)\s+([A-Za-z_$][\w$]*)/g;
  const namedExportPattern = /export\s+(?:type\s+)?\{([^}]+)\}/g;

  for (const match of source.matchAll(declarationPattern)) {
    names.push(match[1]);
  }

  for (const match of source.matchAll(namedExportPattern)) {
    for (const item of match[1].split(",")) {
      const name = item.trim().split(/\s+as\s+/)[0];
      if (name) {
        names.push(name);
      }
    }
  }

  return [...new Set(names)].sort((left, right) => left.localeCompare(right));
}

function indexExports(indexSource) {
  const entries = [];
  const exportPattern = /export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["']([^"']+)["']/g;

  for (const match of indexSource.matchAll(exportPattern)) {
    const names = match[1]
      .split(",")
      .map((item) => item.trim().split(/\s+as\s+/)[0])
      .filter(Boolean);
    entries.push({ names, source: match[2] });
  }

  return entries;
}

function sortedExportKey(entry) {
  return `${entry.source}:${entry.names.join(",")}`;
}

function checkIndex(indexPath, typesRoot, publicFiles, errors) {
  const indexSource = readFileSync(indexPath, "utf8");
  const lines = indexSource.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const importIndexes = lines.flatMap((line, index) => (line.startsWith("import ") ? [index] : []));
  const exportIndexes = lines.flatMap((line, index) => (line.startsWith("export ") ? [index] : []));

  if (importIndexes.length > 0 && exportIndexes.length > 0 && Math.max(...importIndexes) > Math.min(...exportIndexes)) {
    errors.push(`${relativePath(indexPath, typesRoot)} imports must appear before exports.`);
  }

  const importLines = lines.filter((line) => line.startsWith("import "));
  const sortedImports = [...importLines].sort((left, right) => left.localeCompare(right));
  if (importLines.some((line, index) => line !== sortedImports[index])) {
    errors.push(`${relativePath(indexPath, typesRoot)} imports must be sorted by source path.`);
  }

  const entries = indexExports(indexSource);
  const sortedEntries = [...entries].sort((left, right) =>
    sortedExportKey(left).localeCompare(sortedExportKey(right)),
  );

  if (entries.some((entry, index) => sortedExportKey(entry) !== sortedExportKey(sortedEntries[index]))) {
    errors.push(`${relativePath(indexPath, typesRoot)} exports must be sorted by source path and type name.`);
  }

  const exportedPaths = new Set(entries.map((entry) => entry.source));
  for (const filePath of publicFiles) {
    const relative = relativePath(filePath, typesRoot);
    const sourcePath = `./${relative.slice(0, -3)}`;
    const source = readFileSync(filePath, "utf8");

    if (exportedNames(source).length > 0 && !exportedPaths.has(sourcePath)) {
      errors.push(`${relative} is not exported from src/types/index.ts.`);
    }
  }
}

function checkOutsideImports(typesRoot, errors) {
  const srcRoot = path.dirname(typesRoot);
  const sourceFiles = listFiles(srcRoot).filter((filePath) =>
    /\.(?:ts|vue)$/.test(filePath) && !filePath.startsWith(`${typesRoot}${path.sep}`),
  );

  for (const filePath of sourceFiles) {
    const source = readFileSync(filePath, "utf8");
    if (/(?:from|import)\s*["'][^"']*\/types\/(?!index(?:\.ts)?["'])/.test(source)) {
      errors.push(`${relativePath(filePath, srcRoot)} must import public types from @/types.`);
    }
  }
}

export function validateTypes(typesRoot) {
  const errors = [];
  const allFiles = listFiles(typesRoot);
  const publicFiles = [];

  for (const filePath of allFiles) {
    const relative = relativePath(filePath, typesRoot);
    const segments = relative.split("/");
    const fileName = segments.at(-1);
    const topLevelDirectory = segments[0];

    if (fileName.startsWith(".") || fileName === "readme.md" || fileName === "index.ts") {
      continue;
    }

    if (fileName.endsWith(".d.ts")) {
      errors.push(`${relative} must use a Type.ts file name; *.d.ts is not allowed.`);
      continue;
    }

    if (!fileName.endsWith(".ts")) {
      errors.push(`${relative} must be a TypeScript type file.`);
      continue;
    }

    if (!TYPE_FILE_PATTERN.test(fileName)) {
      errors.push(`${relative} must end with Type.ts.`);
    }

    if (segments.length < 2 || topLevelDirectory === "pages" && segments.length !== 2) {
      errors.push(`${relative} must be placed inside a type category directory.`);
    }

    publicFiles.push(filePath);
  }

  const indexPath = path.join(typesRoot, "index.ts");
  if (existsSync(indexPath)) {
    checkIndex(indexPath, typesRoot, publicFiles, errors);
  } else {
    errors.push("src/types/index.ts is required.");
  }

  checkOutsideImports(typesRoot, errors);
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const typesRoot = path.resolve(process.argv[2] ?? "src/types");
  const errors = validateTypes(typesRoot);

  if (errors.length > 0) {
    console.error("Type conventions check failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Type conventions check passed.");
  }
}
