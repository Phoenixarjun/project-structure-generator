import { StructgenError } from "../core/errors.js";
import type {
  BlueprintRecord,
  CatalogueRegistry,
  MaturityLevel,
  PackRecord
} from "../core/types.js";

export interface ValidationIssue {
  type: "error" | "warning";
  code: string;
  message: string;
  resourceId?: string;
  alternatives?: string[];
}

export interface CompatibilityReport {
  valid: boolean;
  issues: ValidationIssue[];
}

function isDimensionCompatible<T extends string>(
  allowed: T[] | undefined,
  target: T
): boolean {
  if (!allowed || allowed.length === 0) {
    return true;
  }
  return allowed.includes(target);
}

export function validateCompatibility(
  blueprintRecord: BlueprintRecord,
  maturity: MaturityLevel,
  selectedPackRecords: PackRecord[],
  catalogue: CatalogueRegistry
): CompatibilityReport {
  const issues: ValidationIssue[] = [];
  const bp = blueprintRecord.blueprint;

  if (bp.supportedMaturities && bp.supportedMaturities.length > 0) {
    if (!bp.supportedMaturities.includes(maturity)) {
      issues.push({
        type: "error",
        code: "UNSUPPORTED_MATURITY",
        message: `Maturity level "${maturity}" is not supported by blueprint "${bp.id}". Supported levels: ${bp.supportedMaturities.join(", ")}.`
      });
    }
  }

  const selectedPackIds = new Set(selectedPackRecords.map((r) => r.pack.id));
  const declaredExtensionPointIds = new Set(
    (bp.extensionPoints ?? []).map((ep) => ep.id)
  );

  for (const packRecord of selectedPackRecords) {
    const pack = packRecord.pack;

    if (bp.incompatibleCapabilities && bp.incompatibleCapabilities.includes(pack.id)) {
      issues.push({
        type: "error",
        code: "INCOMPATIBLE_CAPABILITY",
        message: `Capability "${pack.id}" is explicitly declared incompatible by blueprint "${bp.id}".`,
        resourceId: pack.id
      });
    }

    if (bp.supportedCapabilities && bp.supportedCapabilities.length > 0) {
      if (!bp.supportedCapabilities.includes(pack.id)) {
        issues.push({
          type: "error",
          code: "UNSUPPORTED_CAPABILITY",
          message: `Capability "${pack.id}" is not in the supported capabilities list for blueprint "${bp.id}".`,
          resourceId: pack.id
        });
      }
    }

    if (pack.compatibleWith) {
      const cw = pack.compatibleWith;
      if (bp.projectType && !isDimensionCompatible(cw.projectTypes, bp.projectType)) {
        issues.push({
          type: "error",
          code: "INCOMPATIBLE_PROJECT_TYPE",
          message: `Pack "${pack.id}" is not compatible with project type "${bp.projectType}".`,
          resourceId: pack.id
        });
      }

      if (bp.language && !isDimensionCompatible(cw.languages, bp.language)) {
        issues.push({
          type: "error",
          code: "INCOMPATIBLE_LANGUAGE",
          message: `Pack "${pack.id}" is not compatible with language "${bp.language}".`,
          resourceId: pack.id
        });
      }

      if (bp.framework && !isDimensionCompatible(cw.frameworks, bp.framework)) {
        issues.push({
          type: "error",
          code: "INCOMPATIBLE_FRAMEWORK",
          message: `Pack "${pack.id}" is not compatible with framework "${bp.framework}".`,
          resourceId: pack.id
        });
      }

      if (!isDimensionCompatible(cw.blueprints, bp.id)) {
        issues.push({
          type: "error",
          code: "INCOMPATIBLE_BLUEPRINT",
          message: `Pack "${pack.id}" is not compatible with blueprint "${bp.id}".`,
          resourceId: pack.id
        });
      }

      if (!isDimensionCompatible(cw.maturities, maturity)) {
        issues.push({
          type: "error",
          code: "INCOMPATIBLE_MATURITY",
          message: `Pack "${pack.id}" is not compatible with maturity level "${maturity}".`,
          resourceId: pack.id
        });
      }
    }

    if (pack.conflictsWith) {
      for (const conflictId of pack.conflictsWith) {
        if (selectedPackIds.has(conflictId)) {
          issues.push({
            type: "error",
            code: "CONFLICTING_PACKS",
            message: `Capability pack "${pack.id}" conflicts with selected capability pack "${conflictId}".`,
            resourceId: pack.id
          });
        }
      }
    }

    if (pack.requires) {
      for (const requiredId of pack.requires) {
        if (!selectedPackIds.has(requiredId)) {
          issues.push({
            type: "error",
            code: "MISSING_REQUIRED_PACK",
            message: `Capability pack "${pack.id}" requires missing capability pack "${requiredId}".`,
            resourceId: pack.id
          });
        }
      }
    }

    if (pack.contributions) {
      for (const contrib of pack.contributions) {
        if (!declaredExtensionPointIds.has(contrib.extensionPointId)) {
          const compatibleAlternatives = catalogue.blueprints
            .filter((b) =>
              (b.blueprint.extensionPoints ?? []).some(
                (ep) => ep.id === contrib.extensionPointId
              )
            )
            .map((b) => b.blueprint.id);

          issues.push({
            type: "error",
            code: "MISSING_EXTENSION_POINT",
            message: `Capability "${pack.id}" cannot be applied to blueprint "${bp.id}". Reason: The selected blueprint does not expose the required "${contrib.extensionPointId}" extension point.`,
            resourceId: pack.id,
            alternatives: compatibleAlternatives
          });
        }
      }
    }
  }

  const valid = !issues.some((issue) => issue.type === "error");
  return { valid, issues };
}

export function assertCompatibility(
  blueprintRecord: BlueprintRecord,
  maturity: MaturityLevel,
  selectedPackRecords: PackRecord[],
  catalogue: CatalogueRegistry
): void {
  const report = validateCompatibility(
    blueprintRecord,
    maturity,
    selectedPackRecords,
    catalogue
  );

  if (!report.valid) {
    const errorMessages = report.issues
      .filter((i) => i.type === "error")
      .map((i) => {
        let msg = i.message;
        if (i.alternatives && i.alternatives.length > 0) {
          msg += ` Compatible alternatives: ${i.alternatives.join(", ")}`;
        }
        return msg;
      });

    throw new StructgenError(
      "INCOMPATIBLE_SELECTION",
      `Compatibility validation failed:\n${errorMessages.join("\n")}`
    );
  }
}
