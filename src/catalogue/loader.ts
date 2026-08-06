import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import type {
  Blueprint,
  BlueprintRecord,
  CatalogueRegistry,
  PackManifest,
  PackRecord,
  ProfileManifest,
  ProfileRecord,
  RegistryIssue,
  VaultLocation
} from "../core/types.js";

let legacyVaultWarningEmitted = false;

async function isFile(filePath: string): Promise<boolean> {
  try {
    const s = await stat(filePath);
    return s.isFile();
  } catch {
    return false;
  }
}

async function isDirectory(dirPath: string): Promise<boolean> {
  try {
    const s = await stat(dirPath);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function loadBlueprintFromDir(
  dirPath: string,
  vault: VaultLocation,
  issues: RegistryIssue[]
): Promise<BlueprintRecord | null> {
  const manifestPath = path.join(dirPath, "blueprint.json");
  if (!(await isFile(manifestPath))) {
    return null;
  }

  const parsed = await readJsonFile<Blueprint>(manifestPath);
  if (!parsed || parsed.schemaVersion !== 1 || !parsed.id || !parsed.name) {
    issues.push({
      path: manifestPath,
      message: "Invalid or unsupported blueprint manifest format."
    });
    return null;
  }

  return {
    blueprint: parsed,
    directory: dirPath,
    manifestPath,
    vault
  };
}

async function loadPackFromDir(
  dirPath: string,
  vault: VaultLocation,
  issues: RegistryIssue[]
): Promise<PackRecord | null> {
  const manifestPath = path.join(dirPath, "pack.json");
  if (!(await isFile(manifestPath))) {
    return null;
  }

  const parsed = await readJsonFile<PackManifest>(manifestPath);
  if (!parsed || parsed.schemaVersion !== 1 || !parsed.id || !parsed.name) {
    issues.push({
      path: manifestPath,
      message: "Invalid or unsupported pack manifest format."
    });
    return null;
  }

  return {
    pack: parsed,
    directory: dirPath,
    manifestPath,
    vault
  };
}

async function loadProfileFromFile(
  filePath: string,
  vault: VaultLocation,
  issues: RegistryIssue[]
): Promise<ProfileRecord | null> {
  if (!filePath.endsWith(".json")) {
    return null;
  }

  const parsed = await readJsonFile<ProfileManifest>(filePath);
  if (!parsed || parsed.schemaVersion !== 1 || !parsed.id || !parsed.selection) {
    issues.push({
      path: filePath,
      message: "Invalid or unsupported profile manifest format."
    });
    return null;
  }

  return {
    profile: parsed,
    directory: path.dirname(filePath),
    manifestPath: filePath,
    vault
  };
}

export async function loadCatalogueFromVault(
  vault: VaultLocation
): Promise<CatalogueRegistry> {
  const registry: CatalogueRegistry = {
    blueprints: [],
    packs: [],
    profiles: [],
    issues: []
  };

  if (!(await isDirectory(vault.path))) {
    return registry;
  }

  const blueprintsSubdir = path.join(vault.path, "blueprints");
  const packsSubdir = path.join(vault.path, "packs");
  const profilesSubdir = path.join(vault.path, "profiles");

  if (await isDirectory(blueprintsSubdir)) {
    const entries = await readdir(blueprintsSubdir);
    for (const entry of entries) {
      const full = path.join(blueprintsSubdir, entry);
      if (await isDirectory(full)) {
        const rec = await loadBlueprintFromDir(full, vault, registry.issues);
        if (rec) registry.blueprints.push(rec);
      }
    }
  }

  if (await isDirectory(packsSubdir)) {
    const entries = await readdir(packsSubdir);
    for (const entry of entries) {
      const full = path.join(packsSubdir, entry);
      if (await isDirectory(full)) {
        const rec = await loadPackFromDir(full, vault, registry.issues);
        if (rec) registry.packs.push(rec);
      }
    }
  }

  if (await isDirectory(profilesSubdir)) {
    const entries = await readdir(profilesSubdir);
    for (const entry of entries) {
      const full = path.join(profilesSubdir, entry);
      if (await isFile(full)) {
        const rec = await loadProfileFromFile(full, vault, registry.issues);
        if (rec) registry.profiles.push(rec);
      }
    }
  }

  const rootEntries = await readdir(vault.path);
  let isLegacyFlat = false;
  for (const entry of rootEntries) {
    if (entry === "blueprints" || entry === "packs" || entry === "profiles") {
      continue;
    }
    const full = path.join(vault.path, entry);
    if (await isDirectory(full)) {
      const rec = await loadBlueprintFromDir(full, vault, registry.issues);
      if (rec) {
        if (!registry.blueprints.some((b) => b.blueprint.id === rec.blueprint.id)) {
          registry.blueprints.push(rec);
        }
        isLegacyFlat = true;
      }
    }
  }

  if (isLegacyFlat && !legacyVaultWarningEmitted) {
    legacyVaultWarningEmitted = true;
    process.stderr.write(
      "Legacy vault layout detected. It remains supported, but new resources should use blueprints/, packs/ and profiles/.\n"
    );
  }

  return registry;
}

export function resetLegacyVaultWarning(): void {
  legacyVaultWarningEmitted = false;
}
