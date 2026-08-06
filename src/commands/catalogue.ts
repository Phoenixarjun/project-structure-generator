import { findConfig } from "../config/loader.js";
import { resolveVaultSequence } from "../vault/locations.js";
import { loadCatalogue } from "../catalogue/registry.js";
import { validateCatalogue } from "../catalogue/catalogue-validator.js";
import { buildCatalogueMatrix, formatCatalogueMatrixText } from "../catalogue/matrix.js";
import { printJson } from "../cli/output.js";

export async function runCatalogueValidate(options: {
  explicitVaults: string[];
  json: boolean;
}): Promise<void> {
  const config = await findConfig();
  const vaults = resolveVaultSequence(options.explicitVaults, config);
  const catalogue = await loadCatalogue(vaults);

  const issues = await validateCatalogue(catalogue);

  if (options.json) {
    printJson({
      valid: issues.length === 0,
      issuesCount: issues.length,
      issues
    });
  } else {
    if (issues.length === 0) {
      process.stdout.write("[OK] Catalogue validation passed. All manifests and template files are valid.\n");
    } else {
      process.stdout.write(`Catalogue validation found ${issues.length} issue(s):\n`);
      for (const issue of issues) {
        process.stdout.write(`- [${issue.path}]: ${issue.message}\n`);
      }
      process.exitCode = 1;
    }
  }
}

export async function runCatalogueMatrix(options: {
  explicitVaults: string[];
  json: boolean;
}): Promise<void> {
  const config = await findConfig();
  const vaults = resolveVaultSequence(options.explicitVaults, config);
  const catalogue = await loadCatalogue(vaults);

  if (options.json) {
    printJson({
      blueprints: buildCatalogueMatrix(catalogue),
      packsCount: catalogue.packs.length,
      profilesCount: catalogue.profiles.length
    });
  } else {
    process.stdout.write(formatCatalogueMatrixText(catalogue));
  }
}
