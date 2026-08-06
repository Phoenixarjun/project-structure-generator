import crypto from "node:crypto";
import path from "node:path";
import { StructgenError } from "../core/errors.js";
import type { PlannedEntry, PlannedFile } from "../core/types.js";

export function computeContentHash(content: Uint8Array): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function validatePlanConflicts(
  entries: PlannedEntry[]
): { cleanEntries: PlannedEntry[]; warnings: string[]; conflicts: string[] } {
  const warnings: string[] = [];
  const conflicts: string[] = [];
  const pathToEntry = new Map<string, PlannedEntry>();
  const lowerPathMap = new Map<string, string>();

  for (const entry of entries) {
    const rel = entry.relativePath;

    if (rel.startsWith("..") || path.isAbsolute(rel) || rel.includes("../") || rel.includes("..\\")) {
      conflicts.push(`Path traversal rejected for entry: "${rel}".`);
      continue;
    }

    const lower = rel.toLowerCase();
    if (lowerPathMap.has(lower) && lowerPathMap.get(lower) !== rel) {
      conflicts.push(
        `Case-insensitive path collision detected between "${rel}" and "${lowerPathMap.get(lower)}".`
      );
      continue;
    }
    lowerPathMap.set(lower, rel);

    const existing = pathToEntry.get(rel);
    if (!existing) {
      pathToEntry.set(rel, entry);
      continue;
    }

    if (existing.type !== entry.type) {
      conflicts.push(
        `Hierarchy conflict at "${rel}": one resource defines a ${existing.type} while another defines a ${entry.type}.`
      );
      continue;
    }

    if (existing.type === "directory" && entry.type === "directory") {
      continue;
    }

    if (existing.type === "file" && entry.type === "file") {
      const fileA = existing as PlannedFile;
      const fileB = entry as PlannedFile;

      const hashA = fileA.contentHash ?? computeContentHash(fileA.content);
      const hashB = fileB.contentHash ?? computeContentHash(fileB.content);

      if (hashA === hashB && fileA.mode === fileB.mode) {
        continue;
      }

      conflicts.push(
        `Generation conflict at "${rel}" between ${fileA.sourceResource ?? "first resource"} and ${fileB.sourceResource ?? "second resource"}: content or file mode differs.`
      );
    }
  }

  const allPaths = Array.from(pathToEntry.keys());
  for (const p of allPaths) {
    const entry = pathToEntry.get(p)!;
    if (entry.type === "file") {
      for (const parent of allPaths) {
        if (parent !== p && pathToEntry.get(parent)?.type === "directory") {
          if (p === parent || p.startsWith(parent + "/")) {
            continue;
          }
          if (parent.startsWith(p + "/")) {
            conflicts.push(
              `Hierarchy conflict: file "${p}" conflicts with child directory "${parent}".`
            );
          }
        }
      }
    }
  }

  if (conflicts.length > 0) {
    throw new StructgenError(
      "PLAN_CONFLICT",
      `Generation plan conflicts detected:\n${conflicts.join("\n")}`,
      { conflicts }
    );
  }

  const cleanEntries = Array.from(pathToEntry.values()).sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.relativePath.localeCompare(b.relativePath);
  });

  return { cleanEntries, warnings, conflicts };
}
