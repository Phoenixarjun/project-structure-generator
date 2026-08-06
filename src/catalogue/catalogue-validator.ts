import path from "node:path";
import { stat } from "node:fs/promises";
import { StructgenError } from "../core/errors.js";
import type { CatalogueRegistry, RegistryIssue } from "../core/types.js";
import { isSecretVariableName } from "../profile/manager.js";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const s = await stat(filePath);
    return s.isFile();
  } catch {
    return false;
  }
}

export async function validateCatalogue(
  catalogue: CatalogueRegistry
): Promise<RegistryIssue[]> {
  const issues: RegistryIssue[] = [...catalogue.issues];
  const blueprintIds = new Set(catalogue.blueprints.map((b) => b.blueprint.id));
  const packIds = new Set(catalogue.packs.map((p) => p.pack.id));

  for (const bpRec of catalogue.blueprints) {
    const bp = bpRec.blueprint;
    if (!bp.id || !bp.name || !bp.version) {
      issues.push({
        path: bpRec.manifestPath,
        message: `Blueprint missing required metadata (id, name, version).`
      });
    }

    if (bp.variables) {
      for (const v of bp.variables) {
        if (!v.name || !v.prompt || !v.type) {
          issues.push({
            path: bpRec.manifestPath,
            message: `Blueprint variable in "${bp.id}" missing required properties.`
          });
        }
      }
    }

    if (bp.entries) {
      for (const entry of bp.entries) {
        if (entry.type === "file" && entry.source) {
          const absSource = path.resolve(bpRec.directory, entry.source);
          if (!(await fileExists(absSource))) {
            issues.push({
              path: bpRec.manifestPath,
              message: `Blueprint "${bp.id}" references missing template file: "${entry.source}".`
            });
          }
        }
      }
    }
  }

  for (const packRec of catalogue.packs) {
    const pack = packRec.pack;
    if (!pack.id || !pack.name || !pack.category) {
      issues.push({
        path: packRec.manifestPath,
        message: `Pack missing required fields (id, name, category).`
      });
    }

    if (pack.requires) {
      for (const reqId of pack.requires) {
        if (!packIds.has(reqId)) {
          issues.push({
            path: packRec.manifestPath,
            message: `Pack "${pack.id}" requires missing pack "${reqId}".`
          });
        }
      }
    }

    if (pack.files) {
      for (const entry of pack.files) {
        if (entry.source) {
          const absSource = path.resolve(packRec.directory, entry.source);
          if (!(await fileExists(absSource))) {
            issues.push({
              path: packRec.manifestPath,
              message: `Pack "${pack.id}" references missing template file: "${entry.source}".`
            });
          }
        }
      }
    }
  }

  for (const profRec of catalogue.profiles) {
    const prof = profRec.profile;
    if (!prof.id || !prof.selection) {
      issues.push({
        path: profRec.manifestPath,
        message: `Profile missing id or selection.`
      });
      continue;
    }

    if (!blueprintIds.has(prof.selection.blueprint)) {
      issues.push({
        path: profRec.manifestPath,
        message: `Profile "${prof.id}" references missing blueprint "${prof.selection.blueprint}".`
      });
    }

    for (const capId of prof.selection.capabilities) {
      if (!packIds.has(capId)) {
        issues.push({
          path: profRec.manifestPath,
          message: `Profile "${prof.id}" references missing capability pack "${capId}".`
        });
      }
    }

    if (prof.variables) {
      for (const key of Object.keys(prof.variables)) {
        if (isSecretVariableName(key)) {
          issues.push({
            path: profRec.manifestPath,
            message: `Profile "${prof.id}" contains forbidden secret variable "${key}".`
          });
        }
      }
    }
  }

  return issues;
}
