import os from "node:os";
import path from "node:path";
import {
  VAULT_DIRECTORY_NAME,
  WORKSPACE_DIRECTORY_NAME,
  findPackageRoot
} from "../core/constants.js";
import type { LoadedConfig, VaultLocation } from "../core/types.js";

export function builtInVault(): VaultLocation {
  return {
    kind: "builtin",
    path: path.join(findPackageRoot(), "presets", "builtin"),
    label: "built-in"
  };
}

export function userVault(): VaultLocation {
  const home = process.env.STRUCTGEN_HOME
    ? path.resolve(process.env.STRUCTGEN_HOME)
    : path.join(os.homedir(), ".structgen");

  return {
    kind: "user",
    path: path.join(home, VAULT_DIRECTORY_NAME),
    label: "user"
  };
}

export function workspaceVault(startDirectory = process.cwd()): VaultLocation {
  return {
    kind: "workspace",
    path: path.join(path.resolve(startDirectory), WORKSPACE_DIRECTORY_NAME, VAULT_DIRECTORY_NAME),
    label: "workspace"
  };
}

export function configVaults(config: LoadedConfig | undefined): VaultLocation[] {
  if (!config?.config.vaults) {
    return [];
  }

  return config.config.vaults.map((value, index) => ({
    kind: "workspace" as const,
    path: path.resolve(config.directory, value),
    label: `config:${index + 1}`
  }));
}

export function explicitVaults(values: string[]): VaultLocation[] {
  return values.map((value, index) => ({
    kind: "explicit" as const,
    path: path.resolve(value),
    label: `explicit:${index + 1}`
  }));
}

export function resolveVaultSequence(
  explicitPaths: string[] = [],
  config?: LoadedConfig,
  startDir = process.cwd()
): VaultLocation[] {
  return [
    ...explicitVaults(explicitPaths),
    ...configVaults(config),
    workspaceVault(startDir),
    userVault(),
    builtInVault()
  ];
}
