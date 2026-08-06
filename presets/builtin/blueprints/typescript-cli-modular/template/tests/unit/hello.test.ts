import test from "node:test";
import assert from "node:assert/strict";
import { runHello } from "../../src/cli/commands/hello.js";

void test("runHello produces greeting", () => {
  const output = runHello("Developer");
  assert.ok(output.includes("Hello, Developer!"));
});
