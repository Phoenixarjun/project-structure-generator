import test from "node:test";
import assert from "node:assert/strict";
import { validateBlueprint } from "../src/blueprint/validator.js";

void test("accepts a valid blueprint", () => {
  const blueprint = validateBlueprint({
    schemaVersion: 1,
    id: "example",
    version: "1.0.0",
    name: "Example",
    description: "Example blueprint",
    variables: [
      { name: "projectName", prompt: "Project name", type: "string", required: true }
    ],
    entries: [
      { type: "directory", path: "src/{{projectName}}" },
      { type: "file", path: "README.md", content: "# {{projectName}}" }
    ]
  });

  assert.equal(blueprint.id, "example");
});

void test("rejects path traversal", () => {
  assert.throws(() => validateBlueprint({
    schemaVersion: 1,
    id: "bad",
    version: "1.0.0",
    name: "Bad",
    description: "Bad blueprint",
    variables: [],
    entries: [{ type: "file", path: "../secret", content: "x" }]
  }), /cannot escape/);
});
