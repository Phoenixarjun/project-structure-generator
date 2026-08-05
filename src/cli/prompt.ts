import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { StructgenError } from "../core/errors.js";
import type { Primitive } from "../core/types.js";
import type { VariablePrompter } from "../engine/variables.js";

export class TerminalPrompter implements VariablePrompter {
  async input(prompt: string, defaultValue?: string, required = false): Promise<string> {
    this.assertInteractive();
    while (true) {
      const reader = createInterface({ input: stdin, output: stdout });
      try {
        const suffix = defaultValue === undefined ? "" : ` [${defaultValue}]`;
        const answer = await reader.question(`${prompt}${suffix}: `);
        const trimmed = answer.trim();
        if (trimmed !== "") {
          return trimmed;
        }
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        if (!required) {
          return "";
        }
        stdout.write("Value is required. Please try again.\n");
      } catch (error: unknown) {
        throw new StructgenError("CANCELLED", "Interactive input cancelled or closed", error);
      } finally {
        reader.close();
      }
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
      stdout.write("Invalid answer. Please enter 'y' or 'n'.\n");
    }
  }

  async select(prompt: string, choices: Primitive[], defaultValue?: Primitive): Promise<Primitive> {
    this.assertInteractive();
    stdout.write(`${prompt}\n`);
    choices.forEach((choice, index) => stdout.write(`  ${index + 1}. ${String(choice)}\n`));
    const defaultIndex = defaultValue === undefined
      ? undefined
      : choices.findIndex((choice) => choice === defaultValue) + 1;
    while (true) {
      const answer = await this.input("Select", defaultIndex && defaultIndex > 0 ? String(defaultIndex) : undefined);
      const index = Number.parseInt(answer, 10) - 1;
      if (Number.isInteger(index) && index >= 0 && index < choices.length) {
        return choices[index] ?? null;
      }
      stdout.write(`Invalid selection. Please choose a number between 1 and ${choices.length}.\n`);
    }
  }

  private assertInteractive(): void {
    if (!stdin.isTTY || !stdout.isTTY) {
      throw new StructgenError("NON_INTERACTIVE", "Interactive input is unavailable. Pass --preset and --set values.");
    }
  }
}
