import type { EntryCondition, Primitive } from "../core/types.js";

export function evaluateCondition(
  condition: EntryCondition | undefined,
  values: Record<string, Primitive>
): boolean {
  if (!condition) {
    return true;
  }

  const value = values[condition.variable];

  if (condition.equals !== undefined) {
    return value === condition.equals;
  }

  if (condition.notEquals !== undefined) {
    return value !== condition.notEquals;
  }

  if (condition.exists !== undefined) {
    const exists = value !== undefined && value !== null && value !== "";
    return exists === condition.exists;
  }

  return false;
}
