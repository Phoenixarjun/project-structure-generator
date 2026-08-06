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
    const isKnown = known.has(name) || Array.from(known).some((k) => name.startsWith(k));
    if (!isKnown) {
      throw new StructgenError("UNKNOWN_VARIABLE", `Unknown blueprint variable: ${name}`);
    }
  }

  const values: Record<string, Primitive> = {};

  const setValue = (name: string, val: Primitive) => {
    values[name] = val;
    if (typeof val === "string") {
      const derived = applyTransforms(val, name);
      for (const [dKey, dVal] of Object.entries(derived)) {
        if (values[dKey] === undefined) {
          values[dKey] = dVal;
        }
      }
    }
  };

  for (const variable of variables) {
    if (provided[variable.name] !== undefined) {
      setValue(variable.name, coerce(variable, provided[variable.name] ?? null));
      continue;
    }

    const defaultValue = resolveDefault(variable, values);
    if (variable.internal) {
      if (defaultValue !== undefined) {
        setValue(variable.name, defaultValue);
        continue;
      }
      throw new StructgenError("MISSING_VARIABLE", `Internal variable ${variable.name} requires a default`);
    }

    if (!interactive || !prompter) {
      if (defaultValue !== undefined) {
        setValue(variable.name, defaultValue);
        continue;
      }
      if (variable.required !== false) {
        throw new StructgenError("MISSING_VARIABLE", `Missing required variable: ${variable.name}`);
      }
      setValue(variable.name, "");
      continue;
    }

    if (variable.type === "boolean") {
      const defaultBool = typeof defaultValue === "boolean" ? defaultValue : false;
      setValue(variable.name, await prompter.confirm(variable.prompt, defaultBool));
      continue;
    }

    if (variable.type === "select") {
      setValue(variable.name, await prompter.select(variable.prompt, variable.choices ?? [], defaultValue));
      continue;
    }

    const defaultStr = defaultValue !== undefined ? String(defaultValue) : undefined;
    const required = variable.required !== false && defaultStr === undefined;
    const response = await prompter.input(variable.prompt, defaultStr, required);
    setValue(variable.name, coerce(variable, response));
  }

  const finalValues: Record<string, Primitive> = { ...values };
  for (const [key, val] of Object.entries(values)) {
    if (typeof val === "string") {
      const derived = applyTransforms(val, key);
      for (const [dKey, dVal] of Object.entries(derived)) {
        if (finalValues[dKey] === undefined) {
          finalValues[dKey] = dVal;
        }
      }
    }
  }

  return finalValues;
}

export function applyTransforms(value: string, prefix: string): Record<string, string> {
  return {
    [prefix]: value,
    [`${prefix}Kebab`]: String(transformValue(value, "kebab")),
    [`${prefix}Snake`]: String(transformValue(value, "snake")),
    [`${prefix}Camel`]: String(transformValue(value, "camel")),
    [`${prefix}Pascal`]: String(transformValue(value, "pascal")),
    [`${prefix}Constant`]: String(transformValue(value, "constant")),
    [`${prefix}Path`]: value.replace(/\./g, "/")
  };
}
