import { cp, lstat, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { TextDecoder } from "node:util";
import { BLUEPRINT_FILE_NAME, CONFIG_FILE_NAME, WORKSPACE_DIRECTORY_NAME } from "../core/constants.js";
import { pathExists, resolveInside, writeJsonFile } from "../core/fs.js";
import { StructgenError } from "../core/errors.js";
import type {
  Blueprint,
  BlueprintEntry,
  BlueprintVariable,
  CaptureOptions
} from "../core/types.js";
import { validateBlueprint } from "../blueprint/validator.js";

const decoder = new TextDecoder("utf-8", { fatal: true });
const defaultExcludes = [
  ".git",
  WORKSPACE_DIRECTORY_NAME,
  CONFIG_FILE_NAME,
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".venv",
  "venv",
  "__pycache__",
  ".idea",
  ".DS_Store",
  ".structgen.json",
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".npmrc",
  "*.pem",
  "*.key",
  "id_rsa",
  "id_ed25519"
];

const sensitivePatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /gh[pousr]_[A-Za-z0-9_]{30,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /(?:password|secret|token|api[_-]?key)\s*[:=]\s*["']?[^\s"']{8,}/i
];

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\*/g, ".*").replace(/\?/g, ".")}$`);
}

function shouldExclude(relativePath: string, patterns: string[]): boolean {
  const normalized = relativePath.split(path.sep).join("/");
  const name = path.basename(relativePath);

  if (name === ".env.example") {
    return false;
  }

  return patterns.some((pattern) => {
    const matcher = wildcardToRegExp(pattern.split(path.sep).join("/"));
    return matcher.test(normalized) || matcher.test(name) || normalized.split("/").some((segment) => matcher.test(segment));
  });
}

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function applyReplacements(value: string, options: CaptureOptions): string {
  return options.replacements.reduce(
    (current, replacement) => current.split(replacement.from).join(`{{${replacement.variable}}}`),
    value
  );
}

function isSensitive(text: string): boolean {
  return sensitivePatterns.some((pattern) => pattern.test(text));
}

function stagingPath(vault: string, id: string, purpose: string): string {
  const safeId = id.replace(/[^A-Za-z0-9._-]/g, "-");
  return resolveInside(vault, `.${purpose}-${safeId}-${process.pid}-${Date.now()}`, `${purpose} staging path`);
}

async function replaceAtomically(staging: string, destination: string, force: boolean): Promise<void> {
  const exists = await pathExists(destination);
  if (exists && !force) {
    throw new StructgenError("OUTPUT_CONFLICT", `Blueprint already exists: ${destination}`);
  }

  if (!exists) {
    await rename(staging, destination);
    return;
  }

  const backup = `${destination}.backup-${process.pid}-${Date.now()}`;
  await rename(destination, backup);

  try {
    await rename(staging, destination);
    await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (await pathExists(destination)) {
      await rm(destination, { recursive: true, force: true });
    }
    await rename(backup, destination);
    throw error;
  }
}

export async function captureBlueprint(options: CaptureOptions): Promise<string> {
  const source = path.resolve(options.sourceDirectory);
  const destinationVault = path.resolve(options.destinationVault);
  const destination = resolveInside(destinationVault, options.id, "Blueprint destination");

  if (!(await pathExists(source)) || !(await stat(source)).isDirectory()) {
    throw new StructgenError("CAPTURE_SOURCE_INVALID", `Capture source is not a directory: ${source}`);
  }

  if (options.replacements.some((replacement) => replacement.from === "")) {
    throw new StructgenError("INVALID_REPLACEMENT", "Capture replacement source cannot be empty");
  }

  const replacementNames = new Set<string>();
  for (const replacement of options.replacements) {
    if (replacementNames.has(replacement.variable)) {
      throw new StructgenError("INVALID_REPLACEMENT", `Duplicate capture variable: ${replacement.variable}`);
    }
    replacementNames.add(replacement.variable);
  }

  if ((await pathExists(destination)) && !options.force) {
    throw new StructgenError("OUTPUT_CONFLICT", `Blueprint already exists: ${destination}`);
  }

  await mkdir(destinationVault, { recursive: true });
  const staging = stagingPath(destinationVault, options.id, "capture");
  await mkdir(staging, { recursive: true });

  try {
    const patterns = [...defaultExcludes, ...options.excludes];
    const entries: BlueprintEntry[] = [];
    const variables: BlueprintVariable[] = options.replacements.map((replacement) => {
      const variable: BlueprintVariable = {
        name: replacement.variable,
        prompt: replacement.prompt,
        type: "string",
        required: true
      };
      if (replacement.transform !== undefined) {
        variable.transform = replacement.transform;
      }
      return variable;
    });

    const queue = [""];
    let fileIndex = 0;

    while (queue.length > 0) {
      const relativeDirectory = queue.shift();
      if (relativeDirectory === undefined) {
        break;
      }

      const absoluteDirectory = path.join(source, relativeDirectory);
      const children = await readdir(absoluteDirectory, { withFileTypes: true });

      for (const child of children.sort((left, right) => left.name.localeCompare(right.name))) {
        const relative = path.join(relativeDirectory, child.name);
        if (shouldExclude(relative, patterns)) {
          continue;
        }

        const absolute = path.join(source, relative);
        if (isInside(destinationVault, absolute)) {
          continue;
        }

        const info = await lstat(absolute);
        if (info.isSymbolicLink()) {
          continue;
        }

        const targetPath = applyReplacements(relative.split(path.sep).join("/"), options);

        if (info.isDirectory()) {
          entries.push({ type: "directory", path: targetPath });
          queue.push(relative);
          continue;
        }

        if (!info.isFile()) {
          continue;
        }

        if (info.size > options.maxFileSize) {
          throw new StructgenError(
            "CAPTURE_FILE_TOO_LARGE",
            `File exceeds capture limit of ${options.maxFileSize} bytes: ${relative}`
          );
        }

        const raw = await readFile(absolute);
        let output = raw;
        let template = false;

        try {
          const text = decoder.decode(raw);
          if (!options.allowSensitive && isSensitive(text)) {
            throw new StructgenError(
              "SENSITIVE_CONTENT",
              `Potential secret detected in ${relative}. Remove it or use --allow-sensitive intentionally.`
            );
          }
          output = Buffer.from(applyReplacements(text, options));
          template = true;
        } catch (error) {
          if (error instanceof StructgenError) {
            throw error;
          }
        }

        const sourceName = `template/files/${String(fileIndex).padStart(6, "0")}`;
        fileIndex += 1;
        const sourceDestination = path.join(staging, sourceName);
        await mkdir(path.dirname(sourceDestination), { recursive: true });
        await writeFile(sourceDestination, output);

        entries.push({
          type: "file",
          path: targetPath,
          source: sourceName,
          template,
          mode: info.mode & 0o777
        });
      }
    }

    if (entries.length === 0) {
      throw new StructgenError("EMPTY_CAPTURE", `No files or directories were captured from ${source}`);
    }

    const blueprint = validateBlueprint({
      schemaVersion: 1,
      id: options.id,
      version: options.version,
      name: options.name,
      description: options.description,
      tags: ["captured", "reusable"],
      variables,
      entries,
      metadata: {
        documentation: "Captured from an existing project structure"
      }
    }) as Blueprint;

    await writeJsonFile(path.join(staging, BLUEPRINT_FILE_NAME), blueprint);
    await replaceAtomically(staging, destination, options.force);
    return destination;
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}

export async function importBlueprint(
  sourceDirectory: string,
  destinationVault: string,
  id: string,
  force: boolean
): Promise<string> {
  const vault = path.resolve(destinationVault);
  const destination = resolveInside(vault, id, "Imported blueprint destination");

  if ((await pathExists(destination)) && !force) {
    throw new StructgenError("OUTPUT_CONFLICT", `Blueprint already exists: ${destination}`);
  }

  await mkdir(vault, { recursive: true });
  const staging = stagingPath(vault, id, "import");

  try {
    await cp(sourceDirectory, staging, { recursive: true, errorOnExist: true, force: false });
    await replaceAtomically(staging, destination, force);
    return destination;
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}
