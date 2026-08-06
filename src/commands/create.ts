import path from "node:path";
import { findConfig } from "../config/loader.js";
import { StructgenError } from "../core/errors.js";
import type {
  BlueprintRecord,
  CreateOptions,
  MaturityLevel,
  PackRecord,
  ProfileRecord,
  Primitive,
  ProvenanceManifest
} from "../core/types.js";
import { resolveVariables } from "../engine/variables.js";
import { interpolate } from "../engine/interpolate.js";
import { writeGenerationPlan } from "../engine/writer.js";
import { resolveVaultSequence } from "../vault/locations.js";
import { loadCatalogue } from "../catalogue/registry.js";
import { findBlueprintById, findProfileById, findPackById, queryBlueprints, queryPacks } from "../catalogue/query.js";
import { assertCompatibility } from "../catalogue/compatibility.js";
import { composeGenerationPlan } from "../composition/composer.js";
import { TerminalPrompter } from "../cli/prompt.js";
import { printGeneration, printJson } from "../cli/output.js";
import { writeFile } from "node:fs/promises";
import { PROVENANCE_FILE_NAME } from "../core/constants.js";

async function writeProvenance(plan: Awaited<ReturnType<typeof composeGenerationPlan>>): Promise<string> {
  const prov: ProvenanceManifest = {
    schemaVersion: 1,
    generator: "@naresh007/project-structure-generator",
    generatorVersion: "0.1.2",
    generatedAt: new Date().toISOString(),
    blueprint: {
      kind: "blueprint",
      id: plan.blueprint.blueprint.id,
      source: plan.blueprint.vault.label,
      version: plan.blueprint.blueprint.version
    },
    maturity: plan.maturity,
    capabilities: plan.packs.map((p) => {
      const origin: { kind: "pack"; id: string; source: string; version?: string } = {
        kind: "pack",
        id: p.pack.id,
        source: p.vault.label
      };
      if (p.pack.version) origin.version = p.pack.version;
      return origin;
    }),
    profile: plan.profile
      ? {
          kind: "profile",
          id: plan.profile.profile.id,
          source: plan.profile.vault.label
        }
      : undefined,
    variables: plan.variables,
    files: plan.entries.filter((e) => e.type === "file").map((e) => e.relativePath).sort()
  };

  const targetPath = path.join(plan.targetDirectory, PROVENANCE_FILE_NAME);
  await writeFile(targetPath, JSON.stringify(prov, null, 2), "utf8");
  return targetPath;
}

export async function runCreate(options: CreateOptions): Promise<void> {
  const config = await findConfig();
  const vaults = resolveVaultSequence(options.explicitVaults, config);
  const catalogue = await loadCatalogue(vaults);

  const interactive = options.interactive && !options.json && !options.quiet;
  const prompter = interactive ? new TerminalPrompter() : undefined;

  let bpRec: BlueprintRecord | undefined;
  let maturity: MaturityLevel = options.maturity ?? "standard";
  let packRecs: PackRecord[] = [];
  let profileRec: ProfileRecord | undefined;
  let configuredOutput = options.output;
  let features = options.features;

  const effectivePresetId = options.presetId ?? config?.config.defaultPreset;

  if (options.profileId) {
    profileRec = findProfileById(catalogue, options.profileId);
    if (!profileRec) {
      throw new StructgenError("PROFILE_NOT_FOUND", `Profile not found: ${options.profileId}`);
    }
    bpRec = findBlueprintById(catalogue, profileRec.profile.selection.blueprint);
    maturity = options.maturity ?? profileRec.profile.selection.maturity;
    const capIds = options.capabilities ?? profileRec.profile.selection.capabilities;
    packRecs = capIds
      .map((id) => findPackById(catalogue, id))
      .filter((p): p is PackRecord => p !== undefined);
    configuredOutput = configuredOutput ?? profileRec.profile.output;
    features = features ?? profileRec.profile.selection.features;
  } else if (effectivePresetId) {
    bpRec = findBlueprintById(catalogue, effectivePresetId);
    if (!bpRec) {
      throw new StructgenError("BLUEPRINT_NOT_FOUND", `Blueprint not found: ${effectivePresetId}`);
    }
    if (options.capabilities) {
      packRecs = options.capabilities
        .map((id) => findPackById(catalogue, id))
        .filter((p): p is PackRecord => p !== undefined);
    } else {
      const recPackIds = bpRec.blueprint.maturityDefaults?.[maturity] ?? [];
      packRecs = queryPacks(catalogue, { blueprintRecord: bpRec }).filter((p) =>
        recPackIds.includes(p.pack.id)
      );
    }
  } else if (options.projectType || options.language || options.framework) {
    const matches = queryBlueprints(catalogue, {
      projectType: options.projectType,
      language: options.language,
      framework: options.framework
    });

    if (matches.length === 0) {
      throw new StructgenError(
        "BLUEPRINT_NOT_FOUND",
        "No matching blueprint found for specified criteria."
      );
    }
    bpRec = matches[0];
    if (options.capabilities) {
      packRecs = options.capabilities
        .map((id) => findPackById(catalogue, id))
        .filter((p): p is PackRecord => p !== undefined);
    }
  } else if (interactive) {
    if (options.quick) {
      const projectTypes = ["backend-service", "frontend-application", "cli", "library", "worker"] as const;
      const pType = (await prompter!.select("Select project type", [...projectTypes])) as any;
      const bps = queryBlueprints(catalogue, { projectType: pType });
      if (bps.length === 0) throw new StructgenError("BLUEPRINT_NOT_FOUND", `No blueprints for ${pType}`);
      bpRec = (await prompter!.selectObject("Select blueprint", bps.map((b) => ({ label: b.blueprint.name, value: b })))) as BlueprintRecord;
      maturity = (await prompter!.select("Select maturity", bpRec.blueprint.supportedMaturities ?? ["prototype", "standard", "operational"])) as MaturityLevel;
      const recIds = bpRec.blueprint.maturityDefaults?.[maturity] ?? [];
      packRecs = queryPacks(catalogue, { blueprintRecord: bpRec }).filter((p) => recIds.includes(p.pack.id));
    } else {
      const mode = await prompter!.select("How would you like to start?", [
        "Build as You Go",
        "Quick Template",
        "Reuse From Vault",
        "Direct Blueprint"
      ]);

      if (mode === "Quick Template") {
        const bps = catalogue.blueprints;
        bpRec = (await prompter!.selectObject("Select blueprint", bps.map((b) => ({ label: b.blueprint.name, value: b })))) as BlueprintRecord;
      } else if (mode === "Reuse From Vault" && catalogue.profiles.length > 0) {
        profileRec = (await prompter!.selectObject("Select profile", catalogue.profiles.map((p) => ({ label: p.profile.name, value: p })))) as ProfileRecord;
        bpRec = findBlueprintById(catalogue, profileRec.profile.selection.blueprint);
        maturity = profileRec.profile.selection.maturity;
        packRecs = profileRec.profile.selection.capabilities.map((id) => findPackById(catalogue, id)).filter((p): p is PackRecord => p !== undefined);
      } else if (mode === "Direct Blueprint") {
        const bps = catalogue.blueprints;
        bpRec = (await prompter!.selectObject("Select blueprint", bps.map((b) => ({ label: b.blueprint.name, value: b })))) as BlueprintRecord;
      } else {
        const pTypes = ["backend-service", "frontend-application", "cli", "library", "worker"] as const;
        const pType = (await prompter!.select("1. Select project type", [...pTypes])) as any;
        const bps = queryBlueprints(catalogue, { projectType: pType });
        if (bps.length === 0) throw new StructgenError("BLUEPRINT_NOT_FOUND", `No blueprints for ${pType}`);
        bpRec = (await prompter!.selectObject("2. Select blueprint", bps.map((b) => ({ label: b.blueprint.name, value: b })))) as BlueprintRecord;
        maturity = (await prompter!.select("3. Select maturity", bpRec.blueprint.supportedMaturities ?? ["prototype", "standard", "operational"])) as MaturityLevel;
        const availablePacks = queryPacks(catalogue, { blueprintRecord: bpRec });
        const recIds = bpRec.blueprint.maturityDefaults?.[maturity] ?? [];
        packRecs = await prompter!.multiselect("4. Select capability packs", availablePacks.map((p) => ({ label: p.pack.name, value: p, recommended: recIds.includes(p.pack.id) })), availablePacks.filter((p) => recIds.includes(p.pack.id)));
      }
    }
  } else {
    throw new StructgenError("MISSING_PRESET", "No preset or profile specified in non-interactive mode. Pass --preset or --profile.");
  }

  if (!bpRec) {
    throw new StructgenError("BLUEPRINT_NOT_FOUND", "Blueprint resolution failed.");
  }

  assertCompatibility(bpRec, maturity, packRecs, catalogue);

  const mergedValues: Record<string, Primitive> = {
    ...(config?.config.variables ?? {}),
    ...(profileRec?.profile.variables ?? {}),
    ...options.values
  };

  const values = await resolveVariables(bpRec.blueprint.variables, mergedValues, interactive, prompter);
  const defaultOutput = typeof values.projectName === "string" && values.projectName !== ""
    ? values.projectName
    : bpRec.blueprint.id;

  const finalOutputPattern = configuredOutput ?? config?.config.output ?? defaultOutput;
  const renderedOutput = interpolate(finalOutputPattern, values);
  const output = path.resolve(config?.directory ?? process.cwd(), renderedOutput);

  const planParams: {
    blueprintRecord: BlueprintRecord;
    maturity: MaturityLevel;
    packRecords: PackRecord[];
    targetDirectory: string;
    variables: Record<string, Primitive>;
    profileRecord?: ProfileRecord;
    features?: string[];
  } = {
    blueprintRecord: bpRec,
    maturity,
    packRecords: packRecs,
    targetDirectory: output,
    variables: values
  };

  if (profileRec) planParams.profileRecord = profileRec;
  if (features) planParams.features = features;

  const plan = await composeGenerationPlan(planParams);

  if (options.preview || (options.dryRun && !options.json && !options.quiet)) {
    process.stdout.write(`=== Generation Plan Preview ===\n`);
    process.stdout.write(`Blueprint: ${plan.blueprint.blueprint.id} (${plan.blueprint.vault.label})\n`);
    process.stdout.write(`Maturity: ${plan.maturity}\n`);
    process.stdout.write(`Capabilities: ${plan.packs.map((p) => p.pack.id).join(", ") || "none"}\n`);
    process.stdout.write(`Target Directory: ${plan.targetDirectory}\n`);
    process.stdout.write(`Directories to create: ${plan.entries.filter((e) => e.type === "directory").length}\n`);
    process.stdout.write(`Files to create: ${plan.entries.filter((e) => e.type === "file").length}\n`);
  }

  const result = await writeGenerationPlan(plan as any, {
    force: options.force,
    dryRun: options.dryRun
  });

  if (!options.dryRun) {
    const provPath = await writeProvenance(plan);
    result.metadataFile = provPath;
  }

  if (options.json) {
    printJson({
      blueprint: bpRec.blueprint.id,
      maturity,
      capabilities: packRecs.map((p) => p.pack.id),
      targetDirectory: plan.targetDirectory,
      variables: values,
      result
    });
  } else if (!options.quiet) {
    printGeneration(plan as any, result);
    process.stdout.write(`Operational adds operational scaffolding. It does not guarantee that the application is production-ready.\n`);
  }
}
