import { chmod, lstat, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  GENERATION_METADATA_FILE_NAME
} from "../core/constants.js";
import {
  assertNoSymlinkAncestors,
  pathExists,
  resolveInside
} from "../core/fs.js";
import { StructgenError } from "../core/errors.js";
import type {
  GenerationPlan,
  GenerationResult,
  Primitive
} from "../core/types.js";

function sanitizedVariables(
  plan: GenerationPlan
): Record<string, Primitive | "[REDACTED]"> {
  const sensitive = new Set(
    plan.blueprint.blueprint.variables
      .filter((variable) => variable.sensitive)
      .map((variable) => variable.name)
  );

  return Object.fromEntries(
    Object.entries(plan.variables).map(([name, value]) => [name, sensitive.has(name) ? "[REDACTED]" : value])
  );
}

async function isSymlink(value: string): Promise<boolean> {
  try {
    return (await lstat(value)).isSymbolicLink();
  } catch {
    return false;
  }
}

export async function writeGenerationPlan(
  plan: GenerationPlan,
  options: { force: boolean; dryRun: boolean; writeMetadata?: boolean }
): Promise<GenerationResult> {
  const directories = plan.entries
    .filter((entry) => entry.type === "directory")
    .map((entry) => entry.relativePath)
    .sort((left, right) => left.split(path.sep).length - right.split(path.sep).length);

  const files = plan.entries.filter((entry) => entry.type === "file");
  const metadataRelativePath = GENERATION_METADATA_FILE_NAME;
  const fileTargets = files.map((file) => ({
    file,
    destination: resolveInside(plan.targetDirectory, file.relativePath, "Generated file")
  }));

  if (options.writeMetadata !== false) {
    fileTargets.push({
      file: {
        type: "file",
        relativePath: metadataRelativePath,
        content: Buffer.from(`${JSON.stringify({
          schemaVersion: 1,
          generator: "@naresh007/project-structure-generator",
          blueprint: {
            id: plan.blueprint.blueprint.id,
            version: plan.blueprint.blueprint.version,
            vault: plan.blueprint.vault.kind
          },
          variables: sanitizedVariables(plan),
          generatedAt: new Date().toISOString()
        }, null, 2)}\n`)
      },
      destination: resolveInside(plan.targetDirectory, metadataRelativePath, "Generation metadata")
    });
  }

  const conflicts: string[] = [];

  if (path.parse(plan.targetDirectory).root === plan.targetDirectory) {
    throw new StructgenError("UNSAFE_TARGET", `Refusing to generate directly into filesystem root: ${plan.targetDirectory}`);
  }

  for (const relative of directories) {
    const destination = resolveInside(plan.targetDirectory, relative, "Generated directory");
    if (await pathExists(destination)) {
      const info = await lstat(destination);
      if (info.isSymbolicLink()) {
        throw new StructgenError("SYMLINK_REJECTED", `Refusing to use symlink directory: ${destination}`);
      }
      if (!info.isDirectory()) {
        throw new StructgenError("OUTPUT_TYPE_CONFLICT", `Expected a directory but found another type: ${destination}`);
      }
    }
  }

  for (const { destination } of fileTargets) {
    if (await isSymlink(destination)) {
      throw new StructgenError("SYMLINK_REJECTED", `Refusing to overwrite symlink: ${destination}`);
    }

    if (await pathExists(destination)) {
      const info = await lstat(destination);
      if (!info.isFile()) {
        throw new StructgenError("OUTPUT_TYPE_CONFLICT", `Expected a file but found another type: ${destination}`);
      }
      conflicts.push(destination);
    }
  }

  if (conflicts.length > 0 && !options.force) {
    throw new StructgenError(
      "OUTPUT_CONFLICT",
      `Refusing to overwrite ${conflicts.length} existing file${conflicts.length === 1 ? "" : "s"}. Use --force to overwrite.`,
      conflicts
    );
  }

  const result: GenerationResult = {
    createdDirectories: [],
    createdFiles: [],
    overwrittenFiles: [],
    dryRun: options.dryRun
  };

  for (const relative of directories) {
    const destination = resolveInside(plan.targetDirectory, relative, "Generated directory");
    if (!(await pathExists(destination))) {
      result.createdDirectories.push(relative);
    }
  }

  for (const { file, destination } of fileTargets) {
    const existed = await pathExists(destination);
    if (existed) {
      result.overwrittenFiles.push(file.relativePath);
    } else {
      result.createdFiles.push(file.relativePath);
    }
  }

  if (options.dryRun) {
    return result;
  }

  await mkdir(plan.targetDirectory, { recursive: true });

  for (const relative of directories) {
    const destination = resolveInside(plan.targetDirectory, relative, "Generated directory");
    await assertNoSymlinkAncestors(plan.targetDirectory, destination);
    await mkdir(destination, { recursive: true });
  }

  for (const { file, destination } of fileTargets) {
    await assertNoSymlinkAncestors(plan.targetDirectory, destination);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.content);
    if (file.mode !== undefined) {
      await chmod(destination, file.mode);
    }
  }

  if (options.writeMetadata !== false) {
    result.metadataFile = metadataRelativePath;
  }

  return result;
}
