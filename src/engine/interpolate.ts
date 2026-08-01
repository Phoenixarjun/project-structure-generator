import { StructgenError } from "../core/errors.js";
import type { Primitive, VariableTransform } from "../core/types.js";

const tokenPattern = /{{\s*([A-Za-z][A-Za-z0-9_]*)\s*}}/g;

function words(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.toLowerCase());
}

export function transformValue(value: Primitive, transform: VariableTransform = "identity"): Primitive {
  if (typeof value !== "string") {
    return value;
  }

  const parts = words(value);

  switch (transform) {
    case "identity":
      return value;
    case "kebab":
      return parts.join("-");
    case "snake":
      return parts.join("_");
    case "camel":
      return parts.map((part, index) => index === 0 ? part : `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join("");
    case "pascal":
      return parts.map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join("");
    case "constant":
      return parts.join("_").toUpperCase();
    case "java-package":
      return value
        .toLowerCase()
        .split(".")
        .map((part) => words(part).join(""))
        .filter(Boolean)
        .join(".");
    case "java-path":
      return value
        .toLowerCase()
        .split(".")
        .map((part) => words(part).join(""))
        .filter(Boolean)
        .join("/");
    default:
      return value;
  }
}

export function interpolate(template: string, values: Record<string, Primitive>): string {
  return template.replace(tokenPattern, (_match, name: string) => {
    if (!(name in values)) {
      throw new StructgenError("MISSING_VARIABLE", `Missing value for variable: ${name}`);
    }

    const value = values[name];
    if (value === null) {
      return "";
    }

    return String(value);
  });
}

export function containsTemplateTokens(value: string): boolean {
  tokenPattern.lastIndex = 0;
  return tokenPattern.test(value);
}
