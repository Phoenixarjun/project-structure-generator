import { StructgenError } from "../core/errors.js";

export interface ParsedArguments {
  command: string | undefined;
  subcommand: string | undefined;
  positionals: string[];
  flags: Map<string, string[]>;
}

export function parseArguments(argv: string[]): ParsedArguments {
  const positionals: string[] = [];
  const flags = new Map<string, string[]>();
  let positionalOnly = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === undefined) {
      continue;
    }

    if (positionalOnly) {
      positionals.push(token);
      continue;
    }

    if (token === "--") {
      positionalOnly = true;
      continue;
    }

    if (token.startsWith("--")) {
      const body = token.slice(2);
      const equalsIndex = body.indexOf("=");
      let name: string;
      let value: string;

      if (equalsIndex >= 0) {
        name = body.slice(0, equalsIndex);
        value = body.slice(equalsIndex + 1);
      } else if (body.startsWith("no-") && (argv[index + 1] === undefined || argv[index + 1]?.startsWith("-"))) {
        name = body.slice(3);
        value = "false";
      } else {
        name = body;
        const next = argv[index + 1];
        if (next !== undefined && !next.startsWith("-")) {
          value = next;
          index += 1;
        } else {
          value = "true";
        }
      }

      const existing = flags.get(name) ?? [];
      existing.push(value);
      flags.set(name, existing);
      continue;
    }

    if (token.startsWith("-") && token.length > 1) {
      const short = token.slice(1);
      if (short.length > 1) {
        for (const name of short) {
          const existing = flags.get(name) ?? [];
          existing.push("true");
          flags.set(name, existing);
        }
      } else {
        const next = argv[index + 1];
        const value = next !== undefined && !next.startsWith("-") ? next : "true";
        if (value === next) {
          index += 1;
        }
        const existing = flags.get(short) ?? [];
        existing.push(value);
        flags.set(short, existing);
      }
      continue;
    }

    positionals.push(token);
  }

  return {
    command: positionals.shift(),
    subcommand: positionals[0],
    positionals,
    flags
  };
}

export function flag(args: ParsedArguments, ...names: string[]): string | undefined {
  for (const name of names) {
    const values = args.flags.get(name);
    if (values && values.length > 0) {
      return values.at(-1);
    }
  }
  return undefined;
}

export function flags(args: ParsedArguments, ...names: string[]): string[] {
  const output: string[] = [];
  for (const name of names) {
    output.push(...(args.flags.get(name) ?? []));
  }
  return output;
}

export function booleanFlag(
  args: ParsedArguments,
  names: string[],
  defaultValue = false
): boolean {
  const value = flag(args, ...names);
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }

  throw new StructgenError("INVALID_FLAG", `Flag --${names[0] ?? "unknown"} expects a boolean`);
}

export function integerFlag(
  args: ParsedArguments,
  names: string[],
  defaultValue: number
): number {
  const value = flag(args, ...names);
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new StructgenError("INVALID_FLAG", `Flag --${names[0] ?? "unknown"} expects a non-negative integer`);
  }

  return parsed;
}
