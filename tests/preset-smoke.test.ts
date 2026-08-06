import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { runCreate } from "../src/commands/create.js";
import { temporaryDirectory } from "./helpers.js";

function isCommandAvailable(command: string): boolean {
  try {
    const cmd = process.platform === "win32" ? `cmd /c ${command}` : command;
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

void test("preset smoke test: typescript-cli-modular", async () => {
  const temp = await temporaryDirectory("structgen-ts-smoke-");
  try {
    const outputDir = path.join(temp.path, "ts-demo");
    await runCreate({
      presetId: "typescript-cli-modular",
      output: outputDir,
      values: { projectName: "ts-demo" },
      force: false,
      dryRun: false,
      interactive: false,
      explicitVaults: [],
      json: false
    });

    const pkgJsonPath = path.join(outputDir, "package.json");
    const raw = await readFile(pkgJsonPath, "utf8");
    const parsed = JSON.parse(raw);
    assert.equal(parsed.name, "ts-demo");
  } finally {
    await temp.cleanup();
  }
});

void test("preset smoke test: python-fastapi-native", async () => {
  const temp = await temporaryDirectory("structgen-py-smoke-");
  try {
    const outputDir = path.join(temp.path, "py-demo");
    await runCreate({
      presetId: "python-fastapi-native",
      output: outputDir,
      values: { projectName: "py-demo" },
      force: false,
      dryRun: false,
      interactive: false,
      explicitVaults: [],
      json: false
    });

    const pyprojectPath = path.join(outputDir, "pyproject.toml");
    const content = await readFile(pyprojectPath, "utf8");
    assert.ok(content.includes("name = \"py_demo\""));

    const initFile = path.join(outputDir, "src", "py_demo", "__init__.py");
    await stat(initFile);
  } finally {
    await temp.cleanup();
  }
});

void test("preset smoke test: java-spring-layered", async () => {
  const temp = await temporaryDirectory("structgen-java-layered-");
  try {
    const outputDir = path.join(temp.path, "my-billing-service");
    await runCreate({
      presetId: "java-spring-layered",
      output: outputDir,
      values: { projectName: "my-billing-service" },
      force: false,
      dryRun: false,
      interactive: false,
      explicitVaults: [],
      json: false
    });

    const appFile = path.join(outputDir, "src", "main", "java", "com", "example", "myBillingService", "Application.java");
    const code = await readFile(appFile, "utf8");
    assert.ok(code.includes("package com.example.myBillingService;"));
    assert.ok(code.includes("public class Application"));

    await stat(path.join(outputDir, "build.gradle.kts"));
    await stat(path.join(outputDir, "gradlew"));
  } finally {
    await temp.cleanup();
  }
});

void test("preset smoke test: java-spring-package-by-feature", async () => {
  const temp = await temporaryDirectory("structgen-java-feature-");
  try {
    const outputDir = path.join(temp.path, "my-order-service");
    await runCreate({
      presetId: "java-spring-package-by-feature",
      output: outputDir,
      values: { projectName: "my-order-service" },
      force: false,
      dryRun: false,
      interactive: false,
      explicitVaults: [],
      json: false
    });

    const appFile = path.join(outputDir, "src", "main", "java", "com", "example", "myOrderService", "Application.java");
    const code = await readFile(appFile, "utf8");
    assert.ok(code.includes("package com.example.myOrderService;"));

    await stat(path.join(outputDir, "build.gradle.kts"));
  } finally {
    await temp.cleanup();
  }
});
