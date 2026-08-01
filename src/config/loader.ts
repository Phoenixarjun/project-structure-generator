import path from "node:path";
import { CONFIG_FILE_NAME } from "../core/constants.js";
import { pathExists, readJsonFile } from "../core/fs.js";
import { StructgenError } from "../core/errors.js";
import type { LoadedConfig, ProjectConfig } from "../core/types.js";

export async function findConfig(startDirectory = process.cwd()): Promise<LoadedConfig | undefined> {
  let current = path.resolve(startDirectory);

  while (true) {
    const candidate = path.join(current, CONFIG_FILE_NAME);
    if (await pathExists(candidate)) {
      const config = await readJsonFile<ProjectConfig>(candidate);
      validateConfig(config, candidate);
      return { path: candidate, directory: current, config };
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }

    current = parent;
  }
}

function validateConfig(config: ProjectConfig, value: string): void {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new StructgenError("INVALID_CONFIG", `${value} must contain a JSON object`);
  }

  if (config.vaults !== undefined && (!Array.isArray(config.vaults) || !config.vaults.every((item) => typeof item === "string"))) {
    throw new StructgenError("INVALID_CONFIG", `${value} vaults must be an array of paths`);
  }

  if (config.defaultPreset !== undefined && typeof config.defaultPreset !== "string") {
    throw new StructgenError("INVALID_CONFIG", `${value} defaultPreset must be a string`);
  }

  if (config.output !== undefined && typeof config.output !== "string") {
    throw new StructgenError("INVALID_CONFIG", `${value} output must be a string`);
  }

  if (config.variables !== undefined && (!config.variables || typeof config.variables !== "object" || Array.isArray(config.variables))) {
    throw new StructgenError("INVALID_CONFIG", `${value} variables must be an object`);
  }
}
