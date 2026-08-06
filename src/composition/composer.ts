import path from "node:path";
import { readFile } from "node:fs/promises";
import type {
  BlueprintEntry,
  BlueprintFileEntry,
  BlueprintRecord,
  ExtensionPointContribution,
  GenerationPlan,
  MaturityLevel,
  PackRecord,
  PlannedEntry,
  PlannedFile,
  ProfileRecord,
  Primitive
} from "../core/types.js";
import { evaluateCondition } from "../engine/condition.js";
import { interpolate } from "../engine/interpolate.js";
import { applyExtensionContributions } from "./extension.js";
import { computeContentHash, validatePlanConflicts } from "./conflict.js";
import { applyTransforms, resolveVariables } from "../engine/variables.js";

async function renderEntry(
  entry: BlueprintEntry,
  baseDir: string,
  variables: Record<string, Primitive>,
  sourceName: string
): Promise<PlannedEntry | null> {
  if (!entry || !entry.path) {
    return null;
  }

  if (entry.when && !evaluateCondition(entry.when, variables)) {
    return null;
  }

  const relativePath = interpolate(entry.path, variables);

  if (entry.type === "directory") {
    return {
      type: "directory",
      relativePath,
      sourceResource: sourceName
    };
  }

  const fileEntry = entry as BlueprintFileEntry;
  let contentBuffer: Uint8Array;

  if (fileEntry.content !== undefined) {
    const text = interpolate(fileEntry.content, variables);
    contentBuffer = Buffer.from(text, "utf8");
  } else if (fileEntry.source !== undefined) {
    const absSource = path.resolve(baseDir, fileEntry.source);
    const raw = await readFile(absSource);

    if (fileEntry.template === false) {
      contentBuffer = raw;
    } else {
      const text = raw.toString("utf8");
      const rendered = interpolate(text, variables);
      contentBuffer = Buffer.from(rendered, "utf8");
    }
  } else {
    contentBuffer = new Uint8Array(0);
  }

  const plannedFile: PlannedFile = {
    type: "file",
    relativePath,
    content: contentBuffer,
    sourceResource: sourceName,
    contentHash: computeContentHash(contentBuffer)
  };

  if (fileEntry.mode !== undefined) {
    plannedFile.mode = fileEntry.mode;
  }

  return plannedFile;
}

export async function composeGenerationPlan(options: {
  blueprintRecord: BlueprintRecord;
  maturity: MaturityLevel;
  packRecords: PackRecord[];
  profileRecord?: ProfileRecord | undefined;
  targetDirectory: string;
  variables: Record<string, Primitive>;
  features?: string[] | undefined;
}): Promise<GenerationPlan> {
  const {
    blueprintRecord,
    maturity,
    packRecords,
    profileRecord,
    targetDirectory,
    variables: providedVars,
    features
  } = options;

  const variables = await resolveVariables(blueprintRecord.blueprint.variables, providedVars, false);

  const rawEntries: PlannedEntry[] = [];
  const contributionsMap = new Map<string, ExtensionPointContribution[]>();

  for (const entry of blueprintRecord.blueprint.entries) {
    const rendered = await renderEntry(
      entry,
      blueprintRecord.directory,
      variables,
      `blueprint:${blueprintRecord.blueprint.id}`
    );
    if (rendered) {
      rawEntries.push(rendered);
    }
  }

  for (const packRecord of packRecords) {
    const pack = packRecord.pack;
    const sourceLabel = `pack:${pack.id}`;

    if (pack.directories) {
      for (const dirEntry of pack.directories) {
        const rendered = await renderEntry(
          dirEntry,
          packRecord.directory,
          variables,
          sourceLabel
        );
        if (rendered) rawEntries.push(rendered);
      }
    }

    if (pack.files) {
      for (const fileEntry of pack.files) {
        const rendered = await renderEntry(
          fileEntry,
          packRecord.directory,
          variables,
          sourceLabel
        );
        if (rendered) rawEntries.push(rendered);
      }
    }

    if (pack.contributions) {
      for (const contrib of pack.contributions) {
        const renderedContent = interpolate(contrib.content, variables);
        const epId = contrib.extensionPointId;

        if (!contributionsMap.has(epId)) {
          contributionsMap.set(epId, []);
        }
        contributionsMap.get(epId)!.push({
          extensionPointId: epId,
          content: renderedContent
        });
      }
    }
  }

  if (features && features.length > 0 && blueprintRecord.blueprint.featureTemplate) {
    const ft = blueprintRecord.blueprint.featureTemplate;
    for (const rawFeatureName of features) {
      const featVars = applyTransforms(rawFeatureName, "featureName");

      const combinedVars = {
        ...variables,
        ...featVars
      };

      if (ft.directories) {
        for (const dirEntry of ft.directories) {
          const rendered = await renderEntry(
            dirEntry,
            blueprintRecord.directory,
            combinedVars,
            `feature:${featVars.featureNameKebab}`
          );
          if (rendered) rawEntries.push(rendered);
        }
      }

      if (ft.files) {
        for (const fileEntry of ft.files) {
          const rendered = await renderEntry(
            fileEntry,
            blueprintRecord.directory,
            combinedVars,
            `feature:${featVars.featureNameKebab}`
          );
          if (rendered) rawEntries.push(rendered);
        }
      }
    }
  }

  if (contributionsMap.size > 0 && blueprintRecord.blueprint.extensionPoints) {
    for (const ep of blueprintRecord.blueprint.extensionPoints) {
      const contribs = contributionsMap.get(ep.id);
      if (contribs && contribs.length > 0) {
        const targetRelPath = interpolate(ep.targetFile, variables);

        const fileIndex = rawEntries.findIndex(
          (e) => e.type === "file" && e.relativePath === targetRelPath
        );

        if (fileIndex >= 0) {
          const fileEntry = rawEntries[fileIndex] as PlannedFile;
          const currentText = Buffer.from(fileEntry.content).toString("utf8");
          const updatedText = applyExtensionContributions(currentText, contribs);
          const updatedBuffer = Buffer.from(updatedText, "utf8");

          rawEntries[fileIndex] = {
            ...fileEntry,
            content: updatedBuffer,
            contentHash: computeContentHash(updatedBuffer)
          };
        }
      }
    }
  }

  const { cleanEntries, warnings } = validatePlanConflicts(rawEntries);

  const plan: GenerationPlan = {
    blueprint: blueprintRecord,
    maturity,
    packs: packRecords,
    targetDirectory,
    variables,
    entries: cleanEntries,
    warnings
  };

  if (profileRecord !== undefined) {
    plan.profile = profileRecord;
  }

  return plan;
}
