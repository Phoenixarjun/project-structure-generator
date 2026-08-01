import path from "node:path";
import { findConfig } from "../config/loader.js";
import { StructgenError } from "../core/errors.js";
import type { CreateOptions, Primitive } from "../core/types.js";
import { createGenerationPlan } from "../engine/planner.js";
import { resolveVariables } from "../engine/variables.js";
import { interpolate } from "../engine/interpolate.js";
import { writeGenerationPlan } from "../engine/writer.js";
import { buildRegistry, findBlueprint } from "../vault/registry.js";
import { TerminalPrompter } from "../cli/prompt.js";
import { printGeneration, printJson } from "../cli/output.js";

async function choosePreset(
  records: Awaited<ReturnType<typeof buildRegistry>>["records"],
  interactive: boolean
): Promise<string> {
  if (!interactive) {
    throw new StructgenError("MISSING_PRESET", "No preset selected. Pass --preset or configure defaultPreset.");
  }

  if (records.length === 0) {
    throw new StructgenError("BLUEPRINT_NOT_FOUND", "No blueprints are available");
  }

  const prompter = new TerminalPrompter();
  const selected = await prompter.select(
    "Choose a project structure",
    records.map((record) => record.blueprint.id)
  );
  return String(selected);
}

export async function runCreate(options: CreateOptions): Promise<void> {
  const config = await findConfig();
  const registry = await buildRegistry({
    explicitVaultPaths: options.explicitVaults,
    config
  });

  const presetId = options.presetId ?? config?.config.defaultPreset ?? await choosePreset(registry.records, options.interactive);
  const record = findBlueprint(registry, presetId);

  if (!record) {
    throw new StructgenError("BLUEPRINT_NOT_FOUND", `Blueprint not found: ${presetId}`);
  }

  const mergedValues: Record<string, Primitive> = {
    ...(config?.config.variables ?? {}),
    ...options.values
  };

  const prompter = options.interactive ? new TerminalPrompter() : undefined;
  const values = await resolveVariables(record.blueprint.variables, mergedValues, options.interactive, prompter);
  const configuredOutput = options.output ?? config?.config.output;
  const defaultOutput = typeof values.projectName === "string" && values.projectName !== ""
    ? values.projectName
    : record.blueprint.id;
  const renderedOutput = configuredOutput === undefined ? defaultOutput : interpolate(configuredOutput, values);
  const output = path.resolve(config?.directory ?? process.cwd(), renderedOutput);
  const plan = await createGenerationPlan(record, output, values);
  const result = await writeGenerationPlan(plan, {
    force: options.force,
    dryRun: options.dryRun
  });

  if (options.json) {
    printJson({
      blueprint: record.blueprint.id,
      targetDirectory: plan.targetDirectory,
      variables: values,
      result
    });
  } else {
    printGeneration(plan, result);
  }
}
