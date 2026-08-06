import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { StructgenError } from "../core/errors.js";
import type { Primitive } from "../core/types.js";
import type { VariablePrompter } from "../engine/variables.js";

export interface PromptOption<T> {
  label: string;
  value: T;
  hint?: string | undefined;
  recommended?: boolean | undefined;
}

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

  async selectObject<T>(prompt: string, options: PromptOption<T>[], defaultIndex = 1): Promise<T> {
    this.assertInteractive();
    stdout.write(`${prompt}\n`);
    options.forEach((opt, idx) => {
      const rec = opt.recommended ? " (recommended)" : "";
      const hint = opt.hint ? ` - ${opt.hint}` : "";
      stdout.write(`  ${idx + 1}. ${opt.label}${rec}${hint}\n`);
    });

    while (true) {
      const answer = await this.input("Select choice", String(defaultIndex));
      const idx = Number.parseInt(answer, 10) - 1;
      const selectedOpt = options[idx];
      if (selectedOpt !== undefined) {
        return selectedOpt.value;
      }
      stdout.write(`Invalid selection. Choose 1-${options.length}.\n`);
    }
  }

  async multiselect<T>(
    prompt: string,
    options: PromptOption<T>[],
    defaults: T[] = []
  ): Promise<T[]> {
    if (options.length === 0) return [];
    this.assertInteractive();
    stdout.write(`${prompt} (comma-separated numbers, or 'none'/'all')\n`);

    const defaultSet = new Set(defaults);
    options.forEach((opt, idx) => {
      const isDef = defaultSet.has(opt.value) ? " [X]" : " [ ]";
      const hint = opt.hint ? ` - ${opt.hint}` : "";
      stdout.write(`  ${idx + 1}.${isDef} ${opt.label}${hint}\n`);
    });

    const answer = await this.input("Select options (Enter to accept defaults)");
    if (answer === "") {
      return defaults;
    }
    if (answer.toLowerCase() === "none") {
      return [];
    }
    if (answer.toLowerCase() === "all") {
      return options.map((o) => o.value);
    }

    const selected: T[] = [];
    const parts = answer.split(",").map((s) => s.trim());
    for (const part of parts) {
      const idx = Number.parseInt(part, 10) - 1;
      const opt = options[idx];
      if (opt !== undefined) {
        selected.push(opt.value);
      }
    }
    return selected;
  }

  private assertInteractive(): void {
    if (!stdin.isTTY || !stdout.isTTY) {
      throw new StructgenError("NON_INTERACTIVE", "Interactive input is unavailable. Pass --preset and --set values.");
    }
  }
}
