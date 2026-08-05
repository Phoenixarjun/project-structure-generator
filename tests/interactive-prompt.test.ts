import test from "node:test";
import assert from "node:assert/strict";
import { resolveVariables, type VariablePrompter } from "../src/engine/variables.js";
import { StructgenError } from "../src/core/errors.js";
import type { Primitive } from "../src/core/types.js";

class MockPrompter implements VariablePrompter {
  private inputs: string[];
  public errors: string[] = [];

  constructor(inputs: string[]) {
    this.inputs = [...inputs];
  }

  async input(prompt: string, defaultValue?: string, required = false): Promise<string> {
    while (true) {
      const next = this.inputs.shift();
      if (next === undefined) {
        throw new StructgenError("CANCELLED", "Interactive prompt input exhausted");
      }
      const trimmed = next.trim();
      if (trimmed !== "") {
        return trimmed;
      }
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      if (!required) {
        return "";
      }
      this.errors.push("Value is required");
    }
  }

  async confirm(prompt: string, defaultValue = false): Promise<boolean> {
    const marker = defaultValue ? "Y/n" : "y/N";
    while (true) {
      const answer = await this.input(`${prompt} (${marker})`);
      if (answer === "") {
        return defaultValue;
      }
      const normalized = answer.toLowerCase();
      if (["y", "yes", "true", "1"].includes(normalized)) {
        return true;
      }
      if (["n", "no", "false", "0"].includes(normalized)) {
        return false;
      }
      this.errors.push("Invalid response");
    }
  }

  async select(prompt: string, choices: Primitive[], defaultValue?: Primitive): Promise<Primitive> {
    const defaultIndex = defaultValue === undefined
      ? undefined
      : choices.findIndex((choice) => choice === defaultValue) + 1;

    while (true) {
      const answer = await this.input("Select", defaultIndex && defaultIndex > 0 ? String(defaultIndex) : undefined);
      const index = Number.parseInt(answer, 10) - 1;
      if (Number.isInteger(index) && index >= 0 && index < choices.length) {
        return choices[index] ?? null;
      }
      this.errors.push("Invalid selection");
    }
  }
}

void test("interactive prompt retries on empty required input", async () => {
  const prompter = new MockPrompter(["", "", "my-service"]);
  const result = await resolveVariables(
    [
      {
        name: "projectName",
        prompt: "Project name",
        type: "string",
        required: true,
        transform: "kebab"
      }
    ],
    {},
    true,
    prompter
  );

  assert.equal(result.projectName, "my-service");
  assert.equal(prompter.errors.length, 2);
});

void test("interactive prompt retries on invalid boolean input", async () => {
  const prompter = new MockPrompter(["maybe", "invalid", "yes"]);
  const result = await resolveVariables(
    [
      {
        name: "includeDocker",
        prompt: "Include Docker",
        type: "boolean",
        default: false
      }
    ],
    {},
    true,
    prompter
  );

  assert.equal(result.includeDocker, true);
  assert.equal(prompter.errors.length, 2);
});

void test("interactive prompt retries on out of range select input", async () => {
  const prompter = new MockPrompter(["99", "abc", "2"]);
  const result = await resolveVariables(
    [
      {
        name: "environment",
        prompt: "Environment",
        type: "select",
        choices: ["dev", "staging", "prod"]
      }
    ],
    {},
    true,
    prompter
  );

  assert.equal(result.environment, "staging");
  assert.equal(prompter.errors.length, 2);
});

void test("interactive prompt handles cancellation or exhausted input cleanly", async () => {
  const prompter = new MockPrompter([]);
  await assert.rejects(
    resolveVariables(
      [
        {
          name: "projectName",
          prompt: "Project name",
          type: "string",
          required: true
        }
      ],
      {},
      true,
      prompter
    ),
    (err: unknown) => err instanceof StructgenError && err.code === "CANCELLED"
  );
});
