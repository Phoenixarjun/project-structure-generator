import type { ExtensionPointContribution } from "../core/types.ts";

export function applyExtensionContributions(
  fileContent: string,
  contributions: ExtensionPointContribution[]
): string {
  let result = fileContent;

  for (const contrib of contributions) {
    const epId = contrib.extensionPointId;
    const block = contrib.content.trimEnd();

    const patterns = [
      `/* {{EXTENSION_POINT:${epId}}} */`,
      `// {{EXTENSION_POINT:${epId}}}`,
      `# {{EXTENSION_POINT:${epId}}}`
    ];

    let found = false;
    for (const pattern of patterns) {
      if (result.includes(pattern)) {
        result = result.replace(pattern, `${block}\n${pattern}`);
        found = true;
        break;
      }
    }

    if (!found) {
      result = `${result}\n\n${block}`;
    }
  }

  return result;
}
