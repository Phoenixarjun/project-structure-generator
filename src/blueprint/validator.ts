import path from "node:path";
import {
  BLUEPRINT_SCHEMA_VERSION,
  BLUEPRINT_FILE_NAME
} from "../core/constants.js";
import { assertSafeRelativePath } from "../core/fs.js";
import { StructgenError } from "../core/errors.js";
import type {
  Blueprint,
  BlueprintEntry,
  BlueprintVariable,
  Primitive
} from "../core/types.js";

const identifierPattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const variablePattern = /^[A-Za-z][A-Za-z0-9_]*$/;
const semanticVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const transforms = new Set([
  "identity",
  "kebab",
  "snake",
  "camel",
  "pascal",
  "constant",
  "java-package",
  "java-path"
]);

function fail(message: string): never {
  throw new StructgenError("INVALID_BLUEPRINT", message);
}

function isPrimitive(value: unknown): value is Primitive {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function validateVariable(variable: BlueprintVariable, names: Set<string>): void {
  if (!variable || typeof variable !== "object") {
    fail("Every variable must be an object");
  }

  if (!variablePattern.test(variable.name)) {
    fail(`Invalid variable name: ${variable.name}`);
  }

  if (names.has(variable.name)) {
    fail(`Duplicate variable name: ${variable.name}`);
  }
  names.add(variable.name);

  if (typeof variable.prompt !== "string" || variable.prompt.trim() === "") {
    fail(`Variable ${variable.name} requires a prompt`);
  }

  if (!["string", "boolean", "select"].includes(variable.type)) {
    fail(`Variable ${variable.name} has unsupported type: ${variable.type}`);
  }

  if (variable.default !== undefined && !isPrimitive(variable.default)) {
    fail(`Variable ${variable.name} has an invalid default value`);
  }

  if (variable.transform !== undefined && !transforms.has(variable.transform)) {
    fail(`Variable ${variable.name} has unsupported transform: ${variable.transform}`);
  }

  if (variable.type === "select") {
    if (!Array.isArray(variable.choices) || variable.choices.length === 0) {
      fail(`Select variable ${variable.name} requires choices`);
    }

    if (!variable.choices.every(isPrimitive)) {
      fail(`Select variable ${variable.name} contains a non-primitive choice`);
    }
  }
}

function validateEntry(entry: BlueprintEntry, variables: Set<string>, paths: Set<string>): void {
  if (!entry || typeof entry !== "object") {
    fail("Every entry must be an object");
  }

  if (entry.type !== "directory" && entry.type !== "file") {
    fail(`Unsupported entry type: ${(entry as { type?: unknown }).type}`);
  }

  const normalized = assertSafeRelativePath(entry.path, "Blueprint entry path");
  if (paths.has(normalized)) {
    fail(`Duplicate entry path: ${entry.path}`);
  }
  paths.add(normalized);

  if (entry.when !== undefined) {
    if (!variables.has(entry.when.variable)) {
      fail(`Entry ${entry.path} references unknown condition variable: ${entry.when.variable}`);
    }

    const predicates = [
      entry.when.equals !== undefined,
      entry.when.notEquals !== undefined,
      entry.when.exists !== undefined
    ].filter(Boolean).length;

    if (predicates !== 1) {
      fail(`Entry ${entry.path} condition must define exactly one predicate`);
    }
  }

  if (entry.type === "file") {
    const sourceCount = [entry.source !== undefined, entry.content !== undefined].filter(Boolean).length;
    if (sourceCount !== 1) {
      fail(`File entry ${entry.path} must define exactly one of source or content`);
    }

    if (entry.source !== undefined) {
      assertSafeRelativePath(entry.source, `Source for ${entry.path}`);
    }

    if (entry.mode !== undefined && (!Number.isInteger(entry.mode) || entry.mode < 0 || entry.mode > 0o777)) {
      fail(`File entry ${entry.path} has invalid mode`);
    }
  }
}

export function validateBlueprint(value: unknown, manifestPath = BLUEPRINT_FILE_NAME): Blueprint {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${manifestPath} must contain a JSON object`);
  }

  const blueprint = value as Blueprint;

  if (blueprint.schemaVersion !== BLUEPRINT_SCHEMA_VERSION) {
    fail(`Unsupported schemaVersion in ${manifestPath}: ${String(blueprint.schemaVersion)}`);
  }

  if (!identifierPattern.test(blueprint.id)) {
    fail(`Invalid blueprint id: ${blueprint.id}`);
  }

  if (!semanticVersionPattern.test(blueprint.version)) {
    fail(`Blueprint ${blueprint.id} has invalid version: ${blueprint.version}`);
  }

  if (typeof blueprint.name !== "string" || blueprint.name.trim() === "") {
    fail(`Blueprint ${blueprint.id} requires a name`);
  }

  if (typeof blueprint.description !== "string" || blueprint.description.trim() === "") {
    fail(`Blueprint ${blueprint.id} requires a description`);
  }

  if (!Array.isArray(blueprint.variables)) {
    fail(`Blueprint ${blueprint.id} variables must be an array`);
  }

  if (!Array.isArray(blueprint.entries) || blueprint.entries.length === 0) {
    fail(`Blueprint ${blueprint.id} entries must be a non-empty array`);
  }

  if (blueprint.tags !== undefined && (!Array.isArray(blueprint.tags) || !blueprint.tags.every((tag) => typeof tag === "string"))) {
    fail(`Blueprint ${blueprint.id} tags must be an array of strings`);
  }

  const variableNames = new Set<string>();
  for (const variable of blueprint.variables) {
    validateVariable(variable, variableNames);
  }

  const entryPaths = new Set<string>();
  for (const entry of blueprint.entries) {
    validateEntry(entry, variableNames, entryPaths);
  }

  const references = JSON.stringify(blueprint.entries).match(/{{\s*([A-Za-z][A-Za-z0-9_]*)\s*}}/g) ?? [];
  for (const reference of references) {
    const name = reference.replace(/[{}\s]/g, "");
    if (!variableNames.has(name)) {
      fail(`Blueprint ${blueprint.id} references unknown variable: ${name}`);
    }
  }

  return blueprint;
}

export function validateBlueprintSourcePath(blueprintDirectory: string, source: string): string {
  const normalized = assertSafeRelativePath(source, "Blueprint source");
  const resolved = path.resolve(blueprintDirectory, normalized);
  const prefix = `${path.resolve(blueprintDirectory)}${path.sep}`;

  if (!resolved.startsWith(prefix)) {
    fail(`Blueprint source escapes its directory: ${source}`);
  }

  return resolved;
}
