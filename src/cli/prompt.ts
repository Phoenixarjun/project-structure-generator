import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { StructgenError } from "../core/errors.js";
import type { Primitive } from "../core/types.js";
import type { VariablePrompter } from "../engine/variables.js";

export class TerminalPrompter implements VariablePrompter {
  async input(prompt: string, defaultValue?: string): Promise<string> {
    this.assertInteractive();
    const reader = createInterface({ input: stdin, output: stdout });
    try {
      const suffix = defaultValue === undefined ? "" : ` [${defaultValue}]`;
      const answer = await reader.question(`${prompt}${suffix}: `);
      return answer.trim() === "" && defaultValue !== undefined ? defaultValue : answer.trim();
    } finally {
      reader.close();
    }
  }

  async confirm(prompt: string, defaultValue = false): Promise<boolean> {
    const marker = defaultValue ? "Y/n" : "y/N";
    const answer = await this.input(`${prompt} (${marker})`);
    if (answer === "") {
      return defaultValue;
    }
    return ["y", "yes", "true", "1"].includes(answer.toLowerCase());
  }

  async select(prompt: string, choices: Primitive[], defaultValue?: Primitive): Promise<Primitive> {
    this.assertInteractive();
    stdout.write(`${prompt}\n`);
    choices.forEach((choice, index) => stdout.write(`  ${index + 1}. ${String(choice)}\n`));
    const defaultIndex = defaultValue === undefined
      ? undefined
      : choices.findIndex((choice) => choice === defaultValue) + 1;
    const answer = await this.input("Select", defaultIndex && defaultIndex > 0 ? String(defaultIndex) : undefined);
    const index = Number.parseInt(answer, 10) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= choices.length) {
      throw new StructgenError("INVALID_SELECTION", `Selection must be between 1 and ${choices.length}`);
    }
    return choices[index] ?? null;
  }

  private assertInteractive(): void {
    if (!stdin.isTTY || !stdout.isTTY) {
      throw new StructgenError("NON_INTERACTIVE", "Interactive input is unavailable. Pass --preset and --set values.");
    }
  }
}
