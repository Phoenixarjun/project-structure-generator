import { StructgenError } from "../core/errors.js";
import type { BlueprintVariable, Primitive } from "../core/types.js";
import { interpolate, transformValue } from "./interpolate.js";

export interface VariablePrompter {
  input(prompt: string, defaultValue?: string, required?: boolean): Promise<string>;
  confirm(prompt: string, defaultValue?: boolean): Promise<boolean>;
  select(prompt: string, choices: Primitive[], defaultValue?: Primitive): Promise<Primitive>;
}

function parseBoolean(value: Primitive, variableName: string): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "n"].includes(normalized)) {
      return false;
    }
  }

  throw new StructgenError("INVALID_VARIABLE", `${variableName} must be a boolean`);
}

function coerce(variable: BlueprintVariable, value: Primitive): Primitive {
  if (variable.type === "boolean") {
    return parseBoolean(value, variable.name);
  }

  if (variable.type === "string") {
    if (value === null) {
      return "";
    }
    return transformValue(String(value), variable.transform);
  }

  if (!variable.choices?.some((choice) => choice === value || String(choice) === String(value))) {
    throw new StructgenError(
      "INVALID_VARIABLE",
      `${variable.name} must be one of: ${variable.choices?.map(String).join(", ") ?? ""}`
    );
  }

  return variable.choices.find((choice) => choice === value || String(choice) === String(value)) ?? value;
}

function resolveDefault(variable: BlueprintVariable, values: Record<string, Primitive>): Primitive | undefined {
  if (variable.default === undefined) {
    return undefined;
  }

  if (typeof variable.default === "string") {
    return coerce(variable, interpolate(variable.default, values));
  }

  return coerce(variable, variable.default);
}

export async function resolveVariables(
  variables: BlueprintVariable[],
  provided: Record<string, Primitive>,
  interactive: boolean,
  prompter?: VariablePrompter
): Promise<Record<string, Primitive>> {
  const known = new Set(variables.map((variable) => variable.name));
  for (const name of Object.keys(provided)) {
    if (!known.has(name)) {
      throw new StructgenError("UNKNOWN_VARIABLE", `Unknown blueprint variable: ${name}`);
    }
  }

  const values: Record<string, Primitive> = {};

  for (const variable of variables) {
    if (provided[variable.name] !== undefined) {
      values[variable.name] = coerce(variable, provided[variable.name] ?? null);
      continue;
    }

    const defaultValue = resolveDefault(variable, values);
    if (variable.internal) {
      if (defaultValue !== undefined) {
        values[variable.name] = defaultValue;
        continue;
      }
      throw new StructgenError("MISSING_VARIABLE", `Internal variable ${variable.name} requires a default`);
    }

    if (!interactive || !prompter) {
      if (defaultValue !== undefined) {
        values[variable.name] = defaultValue;
        continue;
      }
      if (variable.required !== false) {
        throw new StructgenError("MISSING_VARIABLE", `Missing required variable: ${variable.name}`);
      }
      values[variable.name] = "";
      continue;
    }

    if (variable.type === "boolean") {
      const defaultBool = typeof defaultValue === "boolean" ? defaultValue : false;
      values[variable.name] = await prompter.confirm(variable.prompt, defaultBool);
      continue;
    }

    if (variable.type === "select") {
      values[variable.name] = await prompter.select(variable.prompt, variable.choices ?? [], defaultValue);
      continue;
    }

    const defaultStr = defaultValue !== undefined ? String(defaultValue) : undefined;
    const required = variable.required !== false && defaultStr === undefined;
    const response = await prompter.input(variable.prompt, defaultStr, required);
    values[variable.name] = coerce(variable, response);
  }

  return values;
}
