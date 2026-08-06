import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { builtInVault } from "../src/vault/locations.js";
import { loadCatalogue } from "../src/catalogue/registry.js";
import { composeGenerationPlan } from "../src/composition/composer.js";
import type { PlannedFile } from "../src/core/types.js";

void test("composition engine inserts extension point contributions into target files", async () => {
  const catalogue = await loadCatalogue([builtInVault()]);
  const pyBp = catalogue.blueprints.find((b) => b.blueprint.id === "python-fastapi-feature-modular")!;
  const otelPack = catalogue.packs.find((p) => p.pack.id === "opentelemetry")!;

  const plan = await composeGenerationPlan({
    blueprintRecord: pyBp,
    maturity: "operational",
    packRecords: [otelPack],
    targetDirectory: "/tmp/test-output",
    variables: {
      projectName: "my-api",
      packageNameSnake: "my_api"
    }
  });

  const mainFile = plan.entries.find(
    (e) => e.type === "file" && e.relativePath === "src/my_api/main.py"
  ) as PlannedFile;

  assert.ok(mainFile);
  const text = Buffer.from(mainFile.content).toString("utf8");
  assert.ok(text.includes("# OpenTelemetry Tracing"));
  assert.ok(text.includes("# OpenTelemetry Bootstrap Setup"));
});

void test("composition engine generates initial features from featureTemplate", async () => {
  const catalogue = await loadCatalogue([builtInVault()]);
  const pyBp = catalogue.blueprints.find((b) => b.blueprint.id === "python-fastapi-feature-modular")!;

  const plan = await composeGenerationPlan({
    blueprintRecord: pyBp,
    maturity: "standard",
    packRecords: [],
    targetDirectory: "/tmp/test-output",
    variables: {
      projectName: "my-api",
      packageNameSnake: "my_api"
    },
    features: ["user-auth", "billing"]
  });

  const authRouter = plan.entries.find(
    (e) => e.type === "file" && e.relativePath === "src/my_api/features/user_auth/router.py"
  ) as PlannedFile;

  const billingRouter = plan.entries.find(
    (e) => e.type === "file" && e.relativePath === "src/my_api/features/billing/router.py"
  ) as PlannedFile;

  assert.ok(authRouter);
  assert.ok(billingRouter);

  const authText = Buffer.from(authRouter.content).toString("utf8");
  assert.ok(authText.includes('prefix="/user-auth"'));
});
