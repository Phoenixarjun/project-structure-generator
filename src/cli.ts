#!/usr/bin/env node
import { parseArguments, booleanFlag, flag, flags, integerFlag } from "./cli/args.js";
import { StructgenError, asStructgenError } from "./core/errors.js";
import type { CaptureReplacement, Primitive, VariableTransform } from "./core/types.js";
import { runCreate } from "./commands/create.js";
import { runList } from "./commands/list.js";
import { runShow } from "./commands/show.js";
import { runValidate } from "./commands/validate.js";
import {
  resolveVaultScope,
  runVaultCapture,
  runVaultImport,
  runVaultInit,
  runVaultRemove
} from "./commands/vault.js";
import { runDoctor } from "./commands/doctor.js";

const help = `Project Structure Generator

Usage:
  structgen list [--json] [--vault PATH]
  structgen show <preset-id> [--json] [--vault PATH]
  structgen create [preset-id] [output] [--set key=value] [--force] [--dry-run]
  structgen validate <blueprint-directory> [--json]
  structgen vault init [--scope workspace|user|PATH] [--default-preset ID]
  structgen vault capture <source-directory> --id ID [--name NAME] [--scope workspace|user|PATH]
  structgen vault import <blueprint-directory> [--scope workspace|user|PATH]
  structgen vault remove <preset-id> [--scope workspace|user|PATH] --yes
  structgen doctor [--json]

Create options:
  --preset ID
  --output PATH
  --set key=value
  --vault PATH
  --force
  --dry-run
  --interactive=false
  --json

Capture options:
  --id ID
  --name NAME
  --description TEXT
  --version X.Y.Z
  --replace from=variable[:transform]
  --exclude PATTERN
  --max-file-size BYTES
  --allow-sensitive
  --force
`;

function parsePrimitive(value: string): Primitive {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  if (normalized === "null") {
    return null;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }
  return value;
}

function parseAssignments(values: string[]): Record<string, Primitive> {
  return Object.fromEntries(values.map((value) => {
    const index = value.indexOf("=");
    if (index <= 0) {
      throw new StructgenError("INVALID_ASSIGNMENT", `Expected key=value, received: ${value}`);
    }
    return [value.slice(0, index), parsePrimitive(value.slice(index + 1))];
  }));
}

function parseReplacements(values: string[], defaultProjectName: string): CaptureReplacement[] {
  const replacements = values.map((value) => {
    const equalsIndex = value.indexOf("=");
    if (equalsIndex <= 0) {
      throw new StructgenError("INVALID_REPLACEMENT", `Expected from=variable[:transform], received: ${value}`);
    }

    const from = value.slice(0, equalsIndex);
    const definition = value.slice(equalsIndex + 1);
    const [variable, transform] = definition.split(":");
    if (!variable) {
      throw new StructgenError("INVALID_REPLACEMENT", `Replacement variable is missing: ${value}`);
    }

    const replacement: CaptureReplacement = {
      from,
      variable,
      prompt: `Value for ${variable}`
    };

    if (transform) {
      replacement.transform = transform as VariableTransform;
    }

    return replacement;
  });

  if (replacements.length === 0) {
    replacements.push({
      from: defaultProjectName,
      variable: "projectName",
      prompt: "Project name",
      transform: "kebab"
    });
  }

  return replacements;
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));
  const command = args.command;
  const json = booleanFlag(args, ["json"], false);

  if (!command || command === "help" || booleanFlag(args, ["help", "h"], false)) {
    process.stdout.write(help);
    return;
  }

  if (command === "list" || command === "presets") {
    await runList({ explicitVaults: flags(args, "vault"), json });
    return;
  }

  if (command === "show") {
    const id = args.positionals[0];
    if (!id) {
      throw new StructgenError("MISSING_ARGUMENT", "show requires a preset id");
    }
    await runShow({ id, explicitVaults: flags(args, "vault"), json });
    return;
  }

  if (command === "create") {
    const positionalPreset = args.positionals[0];
    const positionalOutput = args.positionals[1];
    await runCreate({
      presetId: flag(args, "preset", "p") ?? positionalPreset,
      output: flag(args, "output", "o") ?? positionalOutput,
      values: parseAssignments(flags(args, "set", "s")),
      force: booleanFlag(args, ["force", "f"], false),
      dryRun: booleanFlag(args, ["dry-run"], false),
      interactive: booleanFlag(args, ["interactive"], true),
      explicitVaults: flags(args, "vault"),
      json
    });
    return;
  }

  if (command === "validate") {
    const directory = args.positionals[0];
    if (!directory) {
      throw new StructgenError("MISSING_ARGUMENT", "validate requires a blueprint directory");
    }
    await runValidate(directory, json);
    return;
  }

  if (command === "doctor") {
    await runDoctor(json);
    return;
  }

  if (command === "vault") {
    const subcommand = args.positionals[0];
    const scope = flag(args, "scope") ?? "workspace";
    const destinationVault = resolveVaultScope(scope);

    if (subcommand === "init") {
      await runVaultInit({
        scope,
        defaultPreset: flag(args, "default-preset"),
        force: booleanFlag(args, ["force", "f"], false)
      });
      return;
    }

    if (subcommand === "capture") {
      const sourceDirectory = args.positionals[1];
      const id = flag(args, "id");
      if (!sourceDirectory || !id) {
        throw new StructgenError("MISSING_ARGUMENT", "vault capture requires a source directory and --id");
      }
      const projectName = sourceDirectory.split(/[\\/]/).filter(Boolean).at(-1) ?? id;
      await runVaultCapture({
        sourceDirectory,
        destinationVault,
        id,
        name: flag(args, "name") ?? id,
        description: flag(args, "description") ?? `Reusable structure captured from ${projectName}`,
        version: flag(args, "version") ?? "1.0.0",
        replacements: parseReplacements(flags(args, "replace"), projectName),
        excludes: flags(args, "exclude"),
        maxFileSize: integerFlag(args, ["max-file-size"], 1_048_576),
        force: booleanFlag(args, ["force", "f"], false),
        allowSensitive: booleanFlag(args, ["allow-sensitive"], false)
      });
      return;
    }

    if (subcommand === "import") {
      const sourceDirectory = args.positionals[1];
      if (!sourceDirectory) {
        throw new StructgenError("MISSING_ARGUMENT", "vault import requires a blueprint directory");
      }
      await runVaultImport({
        sourceDirectory,
        destinationVault,
        force: booleanFlag(args, ["force", "f"], false)
      });
      return;
    }

    if (subcommand === "remove") {
      const id = args.positionals[1];
      if (!id) {
        throw new StructgenError("MISSING_ARGUMENT", "vault remove requires a preset id");
      }
      await runVaultRemove({
        id,
        destinationVault,
        yes: booleanFlag(args, ["yes", "y"], false)
      });
      return;
    }

    throw new StructgenError("UNKNOWN_COMMAND", "Unknown vault command. Use init, capture, import, or remove.");
  }

  throw new StructgenError("UNKNOWN_COMMAND", `Unknown command: ${command}`);
}

main().catch((error: unknown) => {
  const normalized = asStructgenError(error);
  process.stderr.write(`Error [${normalized.code}]: ${normalized.message}\n`);
  if (normalized.details && process.env.STRUCTGEN_DEBUG === "1") {
    process.stderr.write(`${JSON.stringify(normalized.details, null, 2)}\n`);
  }
  process.exitCode = 1;
});
