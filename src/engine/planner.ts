import { readFile } from "node:fs/promises";
import path from "node:path";
import { TextDecoder, TextEncoder } from "node:util";
import { StructgenError } from "../core/errors.js";
import { assertSafeRelativePath, resolveInside } from "../core/fs.js";
import type {
  BlueprintRecord,
  GenerationPlan,
  PlannedEntry,
  Primitive
} from "../core/types.js";
import { evaluateCondition } from "./condition.js";
import { containsTemplateTokens, interpolate } from "./interpolate.js";

const decoder = new TextDecoder("utf-8", { fatal: true });
const encoder = new TextEncoder();

function renderBuffer(content: Uint8Array, values: Record<string, Primitive>): Uint8Array {
  let text: string;
  try {
    text = decoder.decode(content);
  } catch {
    return content;
  }

  return encoder.encode(interpolate(text, values));
}

export async function createGenerationPlan(
  record: BlueprintRecord,
  targetDirectory: string,
  variables: Record<string, Primitive>
): Promise<GenerationPlan> {
  const entries: PlannedEntry[] = [];
  const outputPaths = new Map<string, "directory" | "file">();

  for (const entry of record.blueprint.entries) {
    if (!evaluateCondition(entry.when, variables)) {
      continue;
    }

    const renderedPath = interpolate(entry.path, variables);
    if (containsTemplateTokens(renderedPath)) {
      throw new StructgenError("UNRESOLVED_TEMPLATE", `Unresolved template token in path: ${renderedPath}`);
    }

    const relativePath = assertSafeRelativePath(renderedPath, `Rendered path for ${entry.path}`);
    resolveInside(targetDirectory, relativePath, "Generated path");

    if (outputPaths.has(relativePath)) {
      throw new StructgenError("DUPLICATE_OUTPUT", `Multiple entries resolve to ${relativePath}`);
    }

    for (const [existingPath, existingType] of outputPaths) {
      const currentInsideExisting = relativePath.startsWith(`${existingPath}${path.sep}`);
      const existingInsideCurrent = existingPath.startsWith(`${relativePath}${path.sep}`);
      if ((currentInsideExisting && existingType === "file") || (existingInsideCurrent && entry.type === "file")) {
        throw new StructgenError(
          "OUTPUT_HIERARCHY_CONFLICT",
          `File and child path conflict between ${existingPath} and ${relativePath}`
        );
      }
    }

    outputPaths.set(relativePath, entry.type);

    if (entry.type === "directory") {
      entries.push({ type: "directory", relativePath });
      continue;
    }

    let content: Uint8Array;

    if (entry.source !== undefined) {
      const sourcePath = resolveInside(record.directory, entry.source, `Source for ${entry.path}`);
      content = await readFile(sourcePath);
    } else {
      content = encoder.encode(entry.content ?? "");
    }

    if (entry.template !== false) {
      content = renderBuffer(content, variables);
    }

    const file: PlannedEntry = {
      type: "file",
      relativePath,
      content
    };

    if (entry.mode !== undefined) {
      file.mode = entry.mode;
    }

    entries.push(file);
  }

  return {
    blueprint: record,
    targetDirectory: path.resolve(targetDirectory),
    variables,
    entries
  };
}
