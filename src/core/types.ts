export type Primitive = string | number | boolean | null;

export type VariableType = "string" | "boolean" | "select";

export type VariableTransform =
  | "identity"
  | "kebab"
  | "snake"
  | "camel"
  | "pascal"
  | "constant"
  | "java-package"
  | "java-path";

export interface BlueprintVariable {
  name: string;
  prompt: string;
  type: VariableType;
  required?: boolean;
  default?: Primitive;
  choices?: Primitive[];
  transform?: VariableTransform;
  internal?: boolean;
  sensitive?: boolean;
}

export interface EntryCondition {
  variable: string;
  equals?: Primitive;
  notEquals?: Primitive;
  exists?: boolean;
}

export interface BlueprintDirectoryEntry {
  type: "directory";
  path: string;
  when?: EntryCondition;
}

export interface BlueprintFileEntry {
  type: "file";
  path: string;
  source?: string;
  content?: string;
  template?: boolean;
  mode?: number;
  when?: EntryCondition;
}

export type BlueprintEntry = BlueprintDirectoryEntry | BlueprintFileEntry;

export interface BlueprintMetadata {
  language?: string;
  framework?: string;
  architecture?: string;
  organization?: string;
  documentation?: string;
}

export interface Blueprint {
  schemaVersion: 1;
  id: string;
  version: string;
  name: string;
  description: string;
  tags?: string[];
  variables: BlueprintVariable[];
  entries: BlueprintEntry[];
  metadata?: BlueprintMetadata;
}

export type VaultKind = "explicit" | "workspace" | "user" | "builtin";

export interface VaultLocation {
  kind: VaultKind;
  path: string;
  label: string;
}

export interface BlueprintRecord {
  blueprint: Blueprint;
  directory: string;
  manifestPath: string;
  vault: VaultLocation;
}

export interface RegistryIssue {
  path: string;
  message: string;
}

export interface BlueprintRegistry {
  records: BlueprintRecord[];
  issues: RegistryIssue[];
}

export interface ProjectConfig {
  vaults?: string[];
  defaultPreset?: string;
  output?: string;
  variables?: Record<string, Primitive>;
}

export interface LoadedConfig {
  path: string;
  directory: string;
  config: ProjectConfig;
}

export interface PlannedDirectory {
  type: "directory";
  relativePath: string;
}

export interface PlannedFile {
  type: "file";
  relativePath: string;
  content: Uint8Array;
  mode?: number;
}

export type PlannedEntry = PlannedDirectory | PlannedFile;

export interface GenerationPlan {
  blueprint: BlueprintRecord;
  targetDirectory: string;
  variables: Record<string, Primitive>;
  entries: PlannedEntry[];
}

export interface GenerationResult {
  createdDirectories: string[];
  createdFiles: string[];
  overwrittenFiles: string[];
  metadataFile?: string;
  dryRun: boolean;
}

export interface CreateOptions {
  presetId: string | undefined;
  output: string | undefined;
  values: Record<string, Primitive>;
  force: boolean;
  dryRun: boolean;
  interactive: boolean;
  explicitVaults: string[];
  json: boolean;
}

export interface CaptureReplacement {
  from: string;
  variable: string;
  prompt: string;
  transform?: VariableTransform;
}

export interface CaptureOptions {
  sourceDirectory: string;
  destinationVault: string;
  id: string;
  name: string;
  description: string;
  version: string;
  replacements: CaptureReplacement[];
  excludes: string[];
  maxFileSize: number;
  force: boolean;
  allowSensitive: boolean;
}
