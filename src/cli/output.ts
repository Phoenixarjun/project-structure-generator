import type {
  BlueprintRecord,
  GenerationPlan,
  GenerationResult,
  RegistryIssue
} from "../core/types.js";

export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function printRegistry(records: BlueprintRecord[], issues: RegistryIssue[]): void {
  if (records.length === 0) {
    process.stdout.write("No blueprints found.\n");
  } else {
    for (const record of records) {
      const metadata = record.blueprint.metadata;
      const details = [metadata?.language, metadata?.framework, metadata?.architecture].filter(Boolean).join(" / ");
      process.stdout.write(`${record.blueprint.id.padEnd(32)} ${record.blueprint.name} [${record.vault.kind}]${details ? ` — ${details}` : ""}\n`);
    }
  }

  if (issues.length > 0) {
    process.stderr.write(`\nSkipped ${issues.length} invalid blueprint${issues.length === 1 ? "" : "s"}:\n`);
    for (const issue of issues) {
      process.stderr.write(`  ${issue.path}: ${issue.message}\n`);
    }
  }
}

export function printBlueprint(record: BlueprintRecord): void {
  const value = record.blueprint;
  process.stdout.write(`${value.name}\n`);
  process.stdout.write(`${"=".repeat(value.name.length)}\n`);
  process.stdout.write(`ID: ${value.id}\n`);
  process.stdout.write(`Version: ${value.version}\n`);
  process.stdout.write(`Vault: ${record.vault.kind} (${record.vault.path})\n`);
  process.stdout.write(`Description: ${value.description}\n`);
  process.stdout.write(`Variables: ${value.variables.map((variable) => variable.name).join(", ") || "none"}\n`);
  process.stdout.write(`Entries: ${value.entries.length}\n`);
}

export function printGeneration(plan: GenerationPlan, result: GenerationResult): void {
  const action = result.dryRun ? "Would generate" : "Generated";
  process.stdout.write(`${action} ${plan.blueprint.blueprint.id} in ${plan.targetDirectory}\n`);
  process.stdout.write(`Directories: ${result.createdDirectories.length}\n`);
  process.stdout.write(`Files created: ${result.createdFiles.length}\n`);
  process.stdout.write(`Files overwritten: ${result.overwrittenFiles.length}\n`);

  const all = [
    ...result.createdDirectories.map((value) => `D ${value}`),
    ...result.createdFiles.map((value) => `F ${value}`),
    ...result.overwrittenFiles.map((value) => `O ${value}`)
  ];

  if (all.length > 0) {
    process.stdout.write("\n");
    for (const value of all) {
      process.stdout.write(`${value}\n`);
    }
  }
}
