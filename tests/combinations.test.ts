import test from "node:test";
import assert from "node:assert/strict";
import { builtInVault } from "../src/vault/locations.js";
import { loadCatalogue } from "../src/catalogue/registry.js";
import { findBlueprintById, findPackById } from "../src/catalogue/query.js";
import { validateCompatibility } from "../src/catalogue/compatibility.js";
import { composeGenerationPlan } from "../src/composition/composer.js";

void test("combination test: 10 required representative capability combinations", async () => {
  const catalogue = await loadCatalogue([builtInVault()]);

  const testCases = [
    {
      bp: "python-fastapi-feature-modular",
      maturity: "standard" as const,
      packs: ["docker", "postgres", "github-actions"]
    },
    {
      bp: "python-fastapi-feature-modular",
      maturity: "operational" as const,
      packs: ["redis", "structured-logging", "opentelemetry"]
    },
    {
      bp: "java-spring-layered",
      maturity: "standard" as const,
      packs: ["postgres", "docker"]
    },
    {
      bp: "java-spring-modular-monolith",
      maturity: "operational" as const,
      packs: ["kafka", "opentelemetry", "github-actions"]
    },
    {
      bp: "go-command-internal",
      maturity: "standard" as const,
      packs: ["docker", "github-actions"]
    },
    {
      bp: "go-domain-modular",
      maturity: "operational" as const,
      packs: ["postgres", "structured-logging", "opentelemetry"]
    },
    {
      bp: "react-feature-based",
      maturity: "standard" as const,
      packs: ["unit-tests", "github-actions"]
    },
    {
      bp: "nextjs-route-colocated",
      maturity: "standard" as const,
      packs: ["docker", "github-actions"]
    },
    {
      bp: "nextjs-feature-modular",
      maturity: "operational" as const,
      packs: ["docker", "structured-logging", "github-actions"]
    },
    {
      bp: "typescript-cli-modular",
      maturity: "standard" as const,
      packs: ["unit-tests", "github-actions"]
    }
  ];

  for (const tc of testCases) {
    const bpRec = findBlueprintById(catalogue, tc.bp)!;
    assert.ok(bpRec, `Blueprint not found: ${tc.bp}`);
    const packRecs = tc.packs.map((p) => findPackById(catalogue, p)!);

    const compReport = validateCompatibility(bpRec, tc.maturity, packRecs, catalogue);
    assert.equal(compReport.valid, true, `Compatibility failed for ${tc.bp}: ${JSON.stringify(compReport.issues)}`);

    const plan = await composeGenerationPlan({
      blueprintRecord: bpRec,
      maturity: tc.maturity,
      packRecords: packRecs,
      targetDirectory: "/tmp/test-combo",
      variables: { projectName: "combo-app" }
    });

    assert.ok(plan.entries.length > 0);
  }
});

void test("combination test: rejects incompatible pack selections", async () => {
  const catalogue = await loadCatalogue([builtInVault()]);
  const reactBp = findBlueprintById(catalogue, "react-simple")!;
  const postgresPack = findPackById(catalogue, "postgres")!;

  const report = validateCompatibility(reactBp, "standard", [postgresPack], catalogue);
  assert.equal(report.valid, false);
  assert.ok(report.issues.some((i) => i.code === "INCOMPATIBLE_PROJECT_TYPE" || i.code === "UNSUPPORTED_CAPABILITY"));

  const bp = catalogue.blueprints[0]!;
  const k8sPack = findPackById(catalogue, "kubernetes")!;
  const helmPack = findPackById(catalogue, "helm")!;

  const conflictReport = validateCompatibility(bp, "standard", [k8sPack, helmPack], catalogue);
  assert.equal(conflictReport.valid, false);
  assert.ok(conflictReport.issues.some((i) => i.code === "CONFLICTING_PACKS"));
});
