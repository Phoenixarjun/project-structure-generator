import type { CatalogueRegistry } from "../core/types.js";

export interface MatrixRow {
  id: string;
  name: string;
  projectType: string;
  language: string;
  framework: string;
  organization: string;
  defaultMaturity: string;
  capabilitiesCount: number;
}

export function buildCatalogueMatrix(catalogue: CatalogueRegistry): MatrixRow[] {
  return catalogue.blueprints.map((b) => ({
    id: b.blueprint.id,
    name: b.blueprint.name,
    projectType: b.blueprint.projectType ?? "unknown",
    language: b.blueprint.language ?? "unknown",
    framework: b.blueprint.framework ?? "native",
    organization: b.blueprint.organization ?? "default",
    defaultMaturity: b.blueprint.defaultMaturity ?? "standard",
    capabilitiesCount: b.blueprint.supportedCapabilities?.length ?? 0
  }));
}

export function formatCatalogueMatrixText(catalogue: CatalogueRegistry): string {
  const rows = buildCatalogueMatrix(catalogue);
  let out = "=== Project Structure Generator Catalogue Matrix ===\n\n";
  out += `${"ID".padEnd(32)} ${"TYPE".padEnd(20)} ${"LANG".padEnd(12)} ${"FRAMEWORK".padEnd(16)} ${"MATURITY"}\n`;
  out += `${"-".repeat(90)}\n`;

  for (const r of rows) {
    out += `${r.id.padEnd(32)} ${r.projectType.padEnd(20)} ${r.language.padEnd(12)} ${r.framework.padEnd(16)} ${r.defaultMaturity}\n`;
  }

  out += `\nTotal Blueprints: ${rows.length}\n`;
  out += `Total Capability Packs: ${catalogue.packs.length}\n`;
  out += `Total Profiles: ${catalogue.profiles.length}\n`;
  return out;
}
