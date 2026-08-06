import os from "node:os";
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { builtInVault } from "../src/vault/locations.js";
import { loadCatalogue } from "../src/catalogue/registry.js";
import { composeGenerationPlan } from "../src/composition/composer.js";
import { writeGenerationPlan } from "../src/engine/writer.js";
import { findBlueprintById, findPackById } from "../src/catalogue/query.js";

const CONTRACTS: Array<{
  blueprintId: string;
  requiredPaths: string[];
  features?: string[];
}> = [
  {
    blueprintId: "python-fastapi-feature-modular",
    requiredPaths: [
      "src/test_app/bootstrap/application.py",
      "src/test_app/bootstrap/routes.py",
      "src/test_app/shared/config/settings.py",
      "src/test_app/features/authentication/router.py",
      "src/test_app/features/authentication/schemas.py",
      "src/test_app/features/authentication/service.py",
      "src/test_app/features/authentication/repository.py",
      "src/test_app/features/authentication/models.py",
      ".env.example"
    ],
    features: ["authentication"]
  },
  {
    blueprintId: "react-feature-based",
    requiredPaths: [
      "src/app/App.tsx",
      "src/app/providers.tsx",
      "src/app/routes.tsx",
      "src/config/environment.ts",
      "src/features/authentication/index.ts",
      "src/features/authentication/api/client.ts",
      "src/features/authentication/components/AuthenticationView.tsx",
      "src/features/authentication/types/index.ts",
      ".env.example"
    ],
    features: ["authentication"]
  },
  {
    blueprintId: "python-fastapi-layered",
    requiredPaths: [
      "src/test_app/main.py",
      "src/test_app/api/routes/health.py",
      "src/test_app/services/health_service.py"
    ]
  },
  {
    blueprintId: "python-fastapi-native",
    requiredPaths: [
      "src/test_app/main.py",
      "src/test_app/routers/health.py",
      "src/test_app/services/health.py"
    ]
  },
  {
    blueprintId: "python-django-apps",
    requiredPaths: [
      "src/apps/authentication/apps.py",
      "src/apps/authentication/views.py",
      "src/apps/authentication/urls.py"
    ],
    features: ["authentication"]
  },
  {
    blueprintId: "java-spring-layered",
    requiredPaths: [
      "src/main/java/com/example/demo/controller/HealthController.java",
      "src/main/java/com/example/demo/service/HealthService.java"
    ]
  },
  {
    blueprintId: "go-domain-modular",
    requiredPaths: [
      "cmd/api/main.go",
      "internal/app/application.go"
    ]
  },
  {
    blueprintId: "typescript-cli-modular",
    requiredPaths: [
      "src/index.ts",
      "src/cli/commands/hello.ts",
      "src/core/errors/app-error.ts"
    ]
  }
];

test("blueprint contract assertions: architecture and capability packs", async () => {
  const catalogue = await loadCatalogue([builtInVault()]);
  assert.equal(catalogue.blueprints.length, 23);

  for (const contract of CONTRACTS) {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), `contract-${contract.blueprintId}-`));
    try {
      const bpRec = findBlueprintById(catalogue, contract.blueprintId);
      assert.ok(bpRec, `Blueprint not found: ${contract.blueprintId}`);

      const packIds = ["postgres", "opentelemetry", "structured-logging", "unit-tests"];
      const packRecs = packIds
        .map((id) => findPackById(catalogue, id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined);

      const declaredVarNames = bpRec.blueprint.variables.map((v) => v.name);
      const allVars: Record<string, string> = {
        projectName: "test-app",
        packageName: "test_app",
        pythonPackageName: "test_app",
        javaGroup: "com.example",
        javaArtifact: "demo",
        javaPackage: "com.example.demo"
      };
      const matchingVars = Object.fromEntries(
        Object.entries(allVars).filter(([k]) => declaredVarNames.includes(k))
      );

      const plan = await composeGenerationPlan({
        blueprintRecord: bpRec,
        maturity: "operational",
        packRecords: packRecs,
        targetDirectory: tmpDir,
        variables: matchingVars,
        features: contract.features
      });

      const res = await writeGenerationPlan(plan, { force: true, dryRun: false });
      assert.ok(res.createdFiles.length > 0);

      const plannedRelPaths = plan.entries.map((e) => e.relativePath);

      for (const reqPath of contract.requiredPaths) {
        assert.ok(
          plannedRelPaths.includes(reqPath),
          `Blueprint ${contract.blueprintId} missing required path: ${reqPath}`
        );
      }

      assert.ok(
        plannedRelPaths.includes("config/postgres.json"),
        `Blueprint ${contract.blueprintId} missing postgres pack contribution`
      );
      assert.ok(
        plannedRelPaths.includes("config/otel.json"),
        `Blueprint ${contract.blueprintId} missing opentelemetry pack contribution`
      );
      assert.ok(
        plannedRelPaths.includes("config/logging.json"),
        `Blueprint ${contract.blueprintId} missing structured-logging pack contribution`
      );
      assert.ok(
        plannedRelPaths.includes("tests/unit/test_unit.py"),
        `Blueprint ${contract.blueprintId} missing unit-tests pack contribution`
      );
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }
});
