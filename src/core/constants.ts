import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PACKAGE_NAME = "@naresh007/project-structure-generator";
export const CLI_NAME = "structgen";
export const CONFIG_FILE_NAME = "structgen.config.json";
export const WORKSPACE_DIRECTORY_NAME = ".structgen";
export const VAULT_DIRECTORY_NAME = "vault";
export const BLUEPRINT_FILE_NAME = "blueprint.json";
export const GENERATION_METADATA_FILE_NAME = ".structgen.json";
export const PROVENANCE_FILE_NAME = ".structgen.json";
export const BLUEPRINT_SCHEMA_VERSION = 1;
export const MINIMUM_NODE_MAJOR = 22;
export const VERSION = "0.2.2";

export function findPackageRoot(fromUrl: string = import.meta.url): string {
  let current = path.dirname(fileURLToPath(fromUrl));

  while (true) {
    const packageJson = path.join(current, "package.json");
    if (existsSync(packageJson)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error("Unable to locate package root");
    }

    current = parent;
  }
}
