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

    const isCoverage = Boolean(process.env.NODE_V8_COVERAGE);
    if (!isCoverage && isCommandAvailable("npm --version")) {
      const npmCmd = process.platform === "win32" ? "cmd /c npm" : "npm";
      const cleanEnv: Record<string, string | undefined> = {};
      for (const [key, val] of Object.entries(process.env)) {
        const lower = key.toLowerCase();
        if (!lower.startsWith("npm_") && lower !== "init_cwd" && lower !== "node_v8_coverage" && lower !== "node_options") {
          cleanEnv[key] = val;
        }
      }
      execSync(`${npmCmd} install`, { cwd: outputDir, stdio: "ignore", env: cleanEnv });
      execSync(`${npmCmd} run build`, { cwd: outputDir, stdio: "ignore", env: cleanEnv });
      execSync(`${npmCmd} test`, { cwd: outputDir, stdio: "ignore", env: cleanEnv });
      const cliRun = execSync("node dist/src/cli.js --help", { cwd: outputDir, encoding: "utf8", env: cleanEnv });
      assert.ok(cliRun.includes("Usage") || cliRun.length > 0);
    }
  } finally {
    await temp.cleanup();
  }
});

void test("preset smoke test: python-fastapi-clean", async () => {
  const temp = await temporaryDirectory("structgen-py-smoke-");
  try {
    const outputDir = path.join(temp.path, "py-demo");
    await runCreate({
      presetId: "python-fastapi-clean",
      output: outputDir,
      values: { projectName: "py-demo", includeDocker: true },
      force: false,
      dryRun: false,
      interactive: false,
      explicitVaults: [],
      json: false
    });

    const pyprojectPath = path.join(outputDir, "pyproject.toml");
    const content = await readFile(pyprojectPath, "utf8");
    assert.ok(content.includes("name = \"py-demo\"") || content.includes("py_demo"));

    const initFile = path.join(outputDir, "src", "py_demo", "__init__.py");
    await stat(initFile);

    if (isCommandAvailable("python --version") || isCommandAvailable("python3 --version")) {
      const pyCmd = isCommandAvailable("python3 --version") ? "python3" : "python";
      execSync(`${pyCmd} -m compileall src`, { cwd: outputDir, stdio: "ignore" });
    }
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

    const appFile = path.join(outputDir, "src", "main", "java", "com", "example", "mybillingservice", "MyBillingServiceApplication.java");
    const code = await readFile(appFile, "utf8");
    assert.ok(code.includes("package com.example.mybillingservice;"));
    assert.ok(code.includes("public class MyBillingServiceApplication"));

    await stat(path.join(outputDir, "build.gradle.kts"));
    await stat(path.join(outputDir, "gradlew"));
    await stat(path.join(outputDir, "gradlew.bat"));
    await stat(path.join(outputDir, "gradle", "wrapper", "gradle-wrapper.properties"));
    await stat(path.join(outputDir, "gradle", "wrapper", "gradle-wrapper.jar"));
  } finally {
    await temp.cleanup();
  }
});

void test("preset smoke test: java-spring-feature-modular", async () => {
  const temp = await temporaryDirectory("structgen-java-feature-");
  try {
    const outputDir = path.join(temp.path, "my-order-service");
    await runCreate({
      presetId: "java-spring-feature-modular",
      output: outputDir,
      values: { projectName: "my-order-service" },
      force: false,
      dryRun: false,
      interactive: false,
      explicitVaults: [],
      json: false
    });

    const appFile = path.join(outputDir, "src", "main", "java", "com", "example", "myorderservice", "MyOrderServiceApplication.java");
    const code = await readFile(appFile, "utf8");
    assert.ok(code.includes("package com.example.myorderservice;"));
    assert.ok(code.includes("public class MyOrderServiceApplication"));

    await stat(path.join(outputDir, "build.gradle.kts"));
    await stat(path.join(outputDir, "gradlew"));
    await stat(path.join(outputDir, "gradlew.bat"));
    await stat(path.join(outputDir, "gradle", "wrapper", "gradle-wrapper.properties"));
    await stat(path.join(outputDir, "gradle", "wrapper", "gradle-wrapper.jar"));
  } finally {
    await temp.cleanup();
  }
});
