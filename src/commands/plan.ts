import path from "node:path";
import { findConfig } from "../config/loader.js";
import { resolveVaultSequence } from "../vault/locations.js";
import { loadCatalogue } from "../catalogue/registry.js";
import { findBlueprintById, findProfileById, findPackById } from "../catalogue/query.js";
import { assertCompatibility } from "../catalogue/compatibility.js";
import { composeGenerationPlan } from "../composition/composer.js";
import { resolveVariables } from "../engine/variables.js";
import { StructgenError } from "../core/errors.js";
import { printJson } from "../cli/output.js";
import type { CreateOptions, MaturityLevel, PackRecord, Primitive } from "../core/types.js";

export async function runPlan(options: CreateOptions): Promise<void> {
  const config = await findConfig();
  const vaults = resolveVaultSequence(options.explicitVaults, config);
  const catalogue = await loadCatalogue(vaults);

  let presetId = options.presetId;
  let maturity: MaturityLevel = options.maturity ?? "standard";
  let capIds = options.capabilities ?? [];
  let profileRec = options.profileId ? findProfileById(catalogue, options.profileId) : undefined;

  if (profileRec) {
    presetId = profileRec.profile.selection.blueprint;
    maturity = profileRec.profile.selection.maturity;
    capIds = profileRec.profile.selection.capabilities;
  }

  if (!presetId) {
    throw new StructgenError("MISSING_ARGUMENT", "Specify a blueprint ID or profile ID for plan.");
  }

  const bpRec = findBlueprintById(catalogue, presetId);
  if (!bpRec) {
    throw new StructgenError("BLUEPRINT_NOT_FOUND", `Blueprint not found: ${presetId}`);
  }

  const packRecs: PackRecord[] = [];
  for (const capId of capIds) {
    const packRec = findPackById(catalogue, capId);
    if (!packRec) {
      throw new StructgenError("PACK_NOT_FOUND", `Capability pack not found: ${capId}`);
    }
    packRecs.push(packRec);
  }

  assertCompatibility(bpRec, maturity, packRecs, catalogue);

  const mergedValues: Record<string, Primitive> = {
    ...(config?.config.variables ?? {}),
    ...(profileRec?.profile.variables ?? {}),
    ...options.values
  };

  const values = await resolveVariables(bpRec.blueprint.variables, mergedValues, false);
  const targetDir = path.resolve(process.cwd(), options.output ?? bpRec.blueprint.id);

  const plan = await composeGenerationPlan({
    blueprintRecord: bpRec,
    maturity,
    packRecords: packRecs,
    profileRecord: profileRec,
    targetDirectory: targetDir,
    variables: values,
    features: options.features
  });

  if (options.json) {
    printJson({
      blueprint: plan.blueprint.blueprint.id,
      maturity: plan.maturity,
      profile: plan.profile?.profile.id,
      capabilities: plan.packs.map((p) => p.pack.id),
      targetDirectory: plan.targetDirectory,
      variables: plan.variables,
      directoriesCount: plan.entries.filter((e) => e.type === "directory").length,
      filesCount: plan.entries.filter((e) => e.type === "file").length,
      entries: plan.entries.map((e) => ({
        type: e.type,
        path: e.relativePath,
        source: e.sourceResource
      })),
      warnings: plan.warnings
    });
  } else {
    process.stdout.write(`Generation Plan for ${plan.blueprint.blueprint.id}\n`);
    process.stdout.write(`Target Directory: ${plan.targetDirectory}\n`);
    process.stdout.write(`Maturity: ${plan.maturity}\n`);
    process.stdout.write(`Capabilities: ${plan.packs.map((p) => p.pack.id).join(", ") || "none"}\n`);
    process.stdout.write(`Planned Entries: ${plan.entries.length}\n`);
  }
}
