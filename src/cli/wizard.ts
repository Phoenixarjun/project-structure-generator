import type { TerminalPrompter } from "./prompt.js";
import type {
  BlueprintRecord,
  CatalogueRegistry,
  Framework,
  Language,
  MaturityLevel,
  PackRecord,
  ProfileRecord,
  ProjectType
} from "../core/types.js";
import { queryBlueprints, queryPacks } from "../catalogue/query.js";
import { StructgenError } from "../core/errors.js";

export interface GuidedSelectionResult {
  blueprintRecord: BlueprintRecord;
  maturity: MaturityLevel;
  packRecords: PackRecord[];
  profileRecord?: ProfileRecord | undefined;
  outputDirectory?: string | undefined;
  features?: string[] | undefined;
}

export async function runQuickTemplateWizard(
  catalogue: CatalogueRegistry,
  prompter: TerminalPrompter
): Promise<GuidedSelectionResult> {
  const projectTypes: ProjectType[] = [
    "backend-service",
    "frontend-application",
    "cli",
    "library",
    "worker"
  ];

  const projectType = (await prompter.select(
    "Select project type",
    projectTypes,
    "backend-service"
  )) as ProjectType;

  const availableBps = queryBlueprints(catalogue, { projectType });
  if (availableBps.length === 0) {
    throw new StructgenError(
      "BLUEPRINT_NOT_FOUND",
      `No blueprints available for project type "${projectType}".`
    );
  }

  const blueprintRecord = (await prompter.selectObject(
    "Select base blueprint",
    availableBps.map((b) => ({
      label: b.blueprint.name,
      value: b,
      hint: b.blueprint.description
    }))
  )) as BlueprintRecord;

  const maturities: MaturityLevel[] =
    blueprintRecord.blueprint.supportedMaturities ?? ["prototype", "standard", "operational"];

  const maturity = (await prompter.select(
    "Select maturity level",
    maturities,
    blueprintRecord.blueprint.defaultMaturity ?? "standard"
  )) as MaturityLevel;

  const recPackIds = blueprintRecord.blueprint.maturityDefaults?.[maturity] ?? [];
  const recPacks = queryPacks(catalogue, { blueprintRecord }).filter((p) =>
    recPackIds.includes(p.pack.id)
  );

  return {
    blueprintRecord,
    maturity,
    packRecords: recPacks
  };
}

export async function runBuildAsYouGoWizard(
  catalogue: CatalogueRegistry,
  prompter: TerminalPrompter
): Promise<GuidedSelectionResult> {
  const projectTypes: ProjectType[] = [
    "backend-service",
    "frontend-application",
    "cli",
    "library",
    "worker"
  ];

  const projectType = (await prompter.select(
    "1. Select project type",
    projectTypes,
    "backend-service"
  )) as ProjectType;

  const languages: Language[] = ["python", "java", "go", "typescript"];
  const language = (await prompter.select(
    "2. Select language",
    languages,
    "python"
  )) as Language;

  const availableBps = queryBlueprints(catalogue, { projectType, language });
  if (availableBps.length === 0) {
    throw new StructgenError(
      "BLUEPRINT_NOT_FOUND",
      `No blueprints found for ${projectType} in ${language}.`
    );
  }

  const blueprintRecord = (await prompter.selectObject(
    "3. Select architecture base structure",
    availableBps.map((b) => ({
      label: `${b.blueprint.name} (${b.blueprint.framework ?? "native"})`,
      value: b,
      hint: b.blueprint.description
    }))
  )) as BlueprintRecord;

  const maturities: MaturityLevel[] =
    blueprintRecord.blueprint.supportedMaturities ?? ["prototype", "standard", "operational"];

  const maturity = (await prompter.select(
    "4. Select maturity level",
    maturities,
    blueprintRecord.blueprint.defaultMaturity ?? "standard"
  )) as MaturityLevel;

  const availablePacks = queryPacks(catalogue, { blueprintRecord });
  const recPackIds = blueprintRecord.blueprint.maturityDefaults?.[maturity] ?? [];

  const packOptions = availablePacks.map((p) => ({
    label: p.pack.name,
    value: p,
    hint: p.pack.description,
    recommended: recPackIds.includes(p.pack.id)
  }));

  const defaultPacks = availablePacks.filter((p) => recPackIds.includes(p.pack.id));
  const selectedPacks = await prompter.multiselect(
    "5. Select capability packs",
    packOptions,
    defaultPacks
  );

  let features: string[] | undefined;
  if (blueprintRecord.blueprint.featureTemplate) {
    const featInput = await prompter.input(
      "6. Initial features or modules (comma-separated, optional)"
    );
    if (featInput.trim() !== "") {
      features = featInput.split(",").map((s) => s.trim()).filter((s) => s !== "");
    }
  }

  return {
    blueprintRecord,
    maturity,
    packRecords: selectedPacks,
    features
  };
}

export async function runReuseFromVaultWizard(
  catalogue: CatalogueRegistry,
  prompter: TerminalPrompter,
  profileRecord?: ProfileRecord
): Promise<GuidedSelectionResult> {
  let targetProfile = profileRecord;

  if (!targetProfile) {
    if (catalogue.profiles.length === 0) {
      throw new StructgenError(
        "PROFILE_NOT_FOUND",
        "No saved profiles found in vault locations."
      );
    }

    targetProfile = await prompter.selectObject(
      "Select profile to reuse",
      catalogue.profiles.map((p) => ({
        label: `${p.profile.name} (${p.profile.id})`,
        value: p,
        hint: p.profile.description
      }))
    );
  }

  const sel = targetProfile.profile.selection;
  const blueprintRecord = catalogue.blueprints.find((b) => b.blueprint.id === sel.blueprint);

  if (!blueprintRecord) {
    throw new StructgenError(
      "BLUEPRINT_NOT_FOUND",
      `Profile "${targetProfile.profile.id}" references missing blueprint "${sel.blueprint}".`
    );
  }

  const selectedPacks = catalogue.packs.filter((p) =>
    sel.capabilities.includes(p.pack.id)
  );

  return {
    blueprintRecord,
    maturity: sel.maturity,
    packRecords: selectedPacks,
    profileRecord: targetProfile,
    outputDirectory: targetProfile.profile.output,
    features: sel.features
  };
}
