import path from "node:path";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { StructgenError } from "../core/errors.js";
import type {
  CatalogueRegistry,
  ProfileManifest,
  ProfileRecord,
  Primitive,
  VaultLocation
} from "../core/types.js";

const SECRET_KEYWORDS = [
  "password",
  "secret",
  "token",
  "key",
  "credential",
  "auth",
  "bearer",
  "private"
];

export function isSecretVariableName(name: string): boolean {
  const lower = name.toLowerCase();
  return SECRET_KEYWORDS.some((kw) => lower.includes(kw));
}

export function sanitizeProfileVariables(
  vars?: Record<string, Primitive>
): Record<string, Primitive> {
  if (!vars) return {};
  const clean: Record<string, Primitive> = {};

  for (const [key, val] of Object.entries(vars)) {
    if (isSecretVariableName(key)) {
      continue;
    }
    clean[key] = val;
  }

  return clean;
}

export function validateProfileManifest(manifest: ProfileManifest): void {
  if (manifest.schemaVersion !== 1) {
    throw new StructgenError(
      "INVALID_PROFILE",
      `Profile "${manifest.id}" has unsupported schemaVersion ${manifest.schemaVersion}. Expected 1.`
    );
  }

  if (!manifest.id || !manifest.name || !manifest.selection) {
    throw new StructgenError(
      "INVALID_PROFILE",
      `Profile manifest is missing required fields (id, name, selection).`
    );
  }

  const sel = manifest.selection;
  if (
    !sel.projectType ||
    !sel.language ||
    !sel.framework ||
    !sel.blueprint ||
    !sel.maturity ||
    !Array.isArray(sel.capabilities)
  ) {
    throw new StructgenError(
      "INVALID_PROFILE",
      `Profile selection missing required properties.`
    );
  }

  if (manifest.variables) {
    for (const key of Object.keys(manifest.variables)) {
      if (isSecretVariableName(key)) {
        throw new StructgenError(
          "INVALID_PROFILE",
          `Profile "${manifest.id}" contains forbidden secret variable "${key}". Profiles must never store secrets.`
        );
      }
    }
  }

  if (manifest.output && path.isAbsolute(manifest.output)) {
    throw new StructgenError(
      "INVALID_PROFILE",
      `Profile "${manifest.id}" output cannot be an absolute path.`
    );
  }
}

export async function saveProfileToVault(
  profile: ProfileManifest,
  vault: VaultLocation
): Promise<string> {
  validateProfileManifest(profile);
  const cleanVars = sanitizeProfileVariables(profile.variables);
  const finalManifest: ProfileManifest = {
    ...profile,
    variables: cleanVars
  };

  const profilesDir = path.join(vault.path, "profiles");
  const targetPath = path.join(profilesDir, `${profile.id}.json`);

  const rel = path.relative(profilesDir, targetPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new StructgenError(
      "PATH_TRAVERSAL",
      `Target path "${targetPath}" escapes profile directory.`
    );
  }

  await writeFile(targetPath, JSON.stringify(finalManifest, null, 2), "utf8");
  return targetPath;
}

export async function removeProfileFromVault(
  profileId: string,
  vault: VaultLocation
): Promise<boolean> {
  const profilesDir = path.join(vault.path, "profiles");
  const targetPath = path.join(profilesDir, `${profileId}.json`);

  const rel = path.relative(profilesDir, targetPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new StructgenError(
      "PATH_TRAVERSAL",
      `Profile ID "${profileId}" escapes profile vault directory.`
    );
  }

  try {
    await rm(targetPath, { force: true });
    return true;
  } catch {
    return false;
  }
}
