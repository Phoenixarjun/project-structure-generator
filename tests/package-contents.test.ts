import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";

void test("package content test: published files whitelist", () => {
  const rawOutput = execSync("npm pack --dry-run --json --ignore-scripts", {
    cwd: path.resolve("."),
    encoding: "utf8"
  });

  const jsonStart = rawOutput.indexOf("[");
  const jsonEnd = rawOutput.lastIndexOf("]");
  assert.ok(jsonStart >= 0 && jsonEnd > jsonStart, "npm pack did not return JSON output");

  const jsonText = rawOutput.slice(jsonStart, jsonEnd + 1);
  const parsed = JSON.parse(jsonText) as Array<{ files: Array<{ path: string }> }>;
  assert.ok(parsed.length > 0);

  const packFiles = parsed[0]?.files.map((f) => f.path) ?? [];
  assert.ok(packFiles.length > 0);

  const disallowedPatterns = [
    /^src\//,
    /^tests\//,
    /^\.github\//,
    /^\.git\//,
    /^\.env/,
    /^tsconfig\.json$/,
    /^HANDOFF\.md$/,
    /^AGENTS\.md$/
  ];

  for (const filePath of packFiles) {
    for (const pattern of disallowedPatterns) {
      assert.equal(
        pattern.test(filePath),
        false,
        `Disallowed file included in package tarball: ${filePath}`
      );
    }
  }

  const allowedPrefixes = ["dist/", "presets/", "schema/", "docs/"];
  const allowedExact = ["README.md", "LICENSE", "CHANGELOG.md", "package.json"];

  for (const filePath of packFiles) {
    const isPrefixAllowed = allowedPrefixes.some((pref) => filePath.startsWith(pref));
    const isExactAllowed = allowedExact.includes(filePath);
    assert.ok(
      isPrefixAllowed || isExactAllowed,
      `Unexpected file in package tarball: ${filePath}`
    );
  }
});
