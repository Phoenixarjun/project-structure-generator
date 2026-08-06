import test from "node:test";
import assert from "node:assert/strict";
import { hello } from "../src/commands/hello.js";

void test("greets a name", () => {
  assert.equal(hello("developer"), "Hello, developer");
});
