import path from "node:path";
import { BLUEPRINT_FILE_NAME } from "../core/constants.js";
import { pathExists, readJsonFile } from "../core/fs.js";
import { StructgenError } from "../core/errors.js";
import type { Blueprint, BlueprintRecord, VaultLocation } from "../core/types.js";
import { validateBlueprint, validateBlueprintSourcePath } from "./validator.js";

export async function loadBlueprintDirectory(
  directory: string,
  vault: VaultLocation
): Promise<BlueprintRecord> {
  const manifestPath = path.join(directory, BLUEPRINT_FILE_NAME);
  if (!(await pathExists(manifestPath))) {
    throw new StructgenError("BLUEPRINT_NOT_FOUND", `Missing ${BLUEPRINT_FILE_NAME} in ${directory}`);
  }

  const raw = await readJsonFile<Blueprint>(manifestPath);
  const blueprint = validateBlueprint(raw, manifestPath);

  for (const entry of blueprint.entries) {
    if (entry.type === "file" && entry.source !== undefined) {
      const sourcePath = validateBlueprintSourcePath(directory, entry.source);
      if (!(await pathExists(sourcePath))) {
        throw new StructgenError(
          "BLUEPRINT_SOURCE_NOT_FOUND",
          `Blueprint ${blueprint.id} is missing source file: ${entry.source}`
        );
      }
    }
  }

  return {
    blueprint,
    directory: path.resolve(directory),
    manifestPath,
    vault
  };
}
