import { findConfig } from "../config/loader.js";
import { resolveVaultSequence, workspaceVault, userVault, explicitVaults } from "../vault/locations.js";
import { loadCatalogue } from "../catalogue/registry.js";
import { findProfileById } from "../catalogue/query.js";
import {
  saveProfileToVault,
  removeProfileFromVault,
  validateProfileManifest
} from "../profile/manager.js";
import { StructgenError } from "../core/errors.js";
import { printJson } from "../cli/output.js";
import type { ProfileManifest, VaultLocation } from "../core/types.js";

export async function runProfileList(options: {
  explicitVaults: string[];
  json: boolean;
}): Promise<void> {
  const config = await findConfig();
  const vaults = resolveVaultSequence(options.explicitVaults, config);
  const catalogue = await loadCatalogue(vaults);

  if (options.json) {
    printJson(
      catalogue.profiles.map((p) => ({
        id: p.profile.id,
        name: p.profile.name,
        blueprint: p.profile.selection.blueprint,
        maturity: p.profile.selection.maturity,
        capabilities: p.profile.selection.capabilities,
        source: p.vault.label
      }))
    );
    return;
  }

  if (catalogue.profiles.length === 0) {
    process.stdout.write("No profiles found.\n");
    return;
  }

  for (const p of catalogue.profiles) {
    process.stdout.write(
      `${p.profile.id.padEnd(25)} ${p.profile.name} (${p.vault.label})\n`
    );
  }
}

export async function runProfileShow(
  id: string,
  options: { explicitVaults: string[]; json: boolean }
): Promise<void> {
  const config = await findConfig();
  const vaults = resolveVaultSequence(options.explicitVaults, config);
  const catalogue = await loadCatalogue(vaults);

  const profileRec = findProfileById(catalogue, id);
  if (!profileRec) {
    throw new StructgenError("PROFILE_NOT_FOUND", `Profile not found: ${id}`);
  }

  if (options.json) {
    printJson({
      ...profileRec.profile,
      source: profileRec.vault.label,
      manifestPath: profileRec.manifestPath
    });
  } else {
    process.stdout.write(`Profile: ${profileRec.profile.name} (${profileRec.profile.id})\n`);
    process.stdout.write(`Source: ${profileRec.vault.label}\n`);
    process.stdout.write(`Blueprint: ${profileRec.profile.selection.blueprint}\n`);
    process.stdout.write(`Maturity: ${profileRec.profile.selection.maturity}\n`);
    process.stdout.write(
      `Capabilities: ${profileRec.profile.selection.capabilities.join(", ") || "none"}\n`
    );
  }
}

export async function runProfileSave(
  manifest: ProfileManifest,
  options: { scope?: string; explicitVaultPath?: string }
): Promise<string> {
  let targetVault: VaultLocation;
  if (options.explicitVaultPath) {
    targetVault = explicitVaults([options.explicitVaultPath])[0] ?? userVault();
  } else if (options.scope === "user") {
    targetVault = userVault();
  } else {
    targetVault = workspaceVault();
  }

  return await saveProfileToVault(manifest, targetVault);
}

export async function runProfileRemove(
  id: string,
  options: { scope?: string | undefined; yes?: boolean | undefined; explicitVaultPath?: string | undefined }
): Promise<boolean> {
  let targetVault: VaultLocation;
  if (options.explicitVaultPath) {
    targetVault = explicitVaults([options.explicitVaultPath])[0] ?? userVault();
  } else if (options.scope === "user") {
    targetVault = userVault();
  } else {
    targetVault = workspaceVault();
  }

  return await removeProfileFromVault(id, targetVault);
}

export async function runProfileValidate(
  id: string,
  options: { explicitVaults: string[] }
): Promise<boolean> {
  const config = await findConfig();
  const vaults = resolveVaultSequence(options.explicitVaults, config);
  const catalogue = await loadCatalogue(vaults);

  const rec = findProfileById(catalogue, id);
  if (!rec) {
    throw new StructgenError("PROFILE_NOT_FOUND", `Profile not found: ${id}`);
  }

  validateProfileManifest(rec.profile);
  process.stdout.write(`[OK] Profile "${id}" is valid.\n`);
  return true;
}
