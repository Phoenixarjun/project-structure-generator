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
  required?: boolean | undefined;
  default?: Primitive | undefined;
  choices?: Primitive[] | undefined;
  transform?: VariableTransform | undefined;
  internal?: boolean | undefined;
  sensitive?: boolean | undefined;
}

export interface EntryCondition {
  variable: string;
  equals?: Primitive | undefined;
  notEquals?: Primitive | undefined;
  exists?: boolean | undefined;
}

export interface BlueprintDirectoryEntry {
  type: "directory";
  path: string;
  when?: EntryCondition | undefined;
}

export interface BlueprintFileEntry {
  type: "file";
  path: string;
  source?: string | undefined;
  content?: string | undefined;
  template?: boolean | undefined;
  mode?: number | undefined;
  when?: EntryCondition | undefined;
}

export type BlueprintEntry = BlueprintDirectoryEntry | BlueprintFileEntry;

export interface BlueprintMetadata {
  language?: string | undefined;
  framework?: string | undefined;
  architecture?: string | undefined;
  organization?: string | undefined;
  documentation?: string | undefined;
}

export type ProjectType =
  | "backend-service"
  | "frontend-application"
  | "fullstack-application"
  | "cli"
  | "library"
  | "worker";

export type Language = "python" | "java" | "go" | "typescript";

export type Framework =
  | "fastapi"
  | "flask"
  | "django"
  | "spring-boot"
  | "go-standard-library"
  | "react"
  | "nextjs"
  | "typescript-node";

export type MaturityLevel = "prototype" | "standard" | "operational";

export type ResourceKind = "blueprint" | "pack" | "profile";

export interface ExtensionPoint {
  id: string;
  description: string;
  targetFile: string;
  marker: string;
}

export interface ExtensionPointContribution {
  extensionPointId: string;
  content: string;
}

export interface PackCompatibility {
  projectTypes?: ProjectType[] | undefined;
  languages?: Language[] | undefined;
  frameworks?: Framework[] | undefined;
  blueprints?: string[] | undefined;
  maturities?: MaturityLevel[] | undefined;
}

export interface PackManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  category: string;
  description: string;
  version?: string | undefined;
  compatibleWith?: PackCompatibility | undefined;
  conflictsWith?: string[] | undefined;
  requires?: string[] | undefined;
  variables?: BlueprintVariable[] | undefined;
  directories?: BlueprintDirectoryEntry[] | undefined;
  files?: BlueprintFileEntry[] | undefined;
  entries?: BlueprintEntry[] | undefined;
  contributions?: ExtensionPointContribution[] | undefined;
}

export interface ProfileSelection {
  projectType: ProjectType;
  language: Language;
  framework: Framework;
  blueprint: string;
  maturity: MaturityLevel;
  capabilities: string[];
  features?: string[] | undefined;
}

export interface ProfileManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  description?: string | undefined;
  selection: ProfileSelection;
  variables?: Record<string, Primitive> | undefined;
  output?: string | undefined;
}

export type VaultKind = "explicit" | "workspace" | "user" | "builtin";

export interface VaultLocation {
  kind: VaultKind;
  path: string;
  label: string;
}

export interface ResourceOrigin {
  kind: ResourceKind;
  id: string;
  source: VaultKind | string;
  version?: string | undefined;
}

export interface ProvenanceManifest {
  schemaVersion: 1;
  generator: string;
  generatorVersion: string;
  generatedAt: string;
  blueprint: ResourceOrigin;
  maturity: MaturityLevel;
  capabilities: ResourceOrigin[];
  profile?: ResourceOrigin | undefined;
  variables: Record<string, Primitive>;
  files: string[];
}

export interface Blueprint {
  schemaVersion: 1;
  id: string;
  version: string;
  name: string;
  description: string;
  projectType?: ProjectType | undefined;
  language?: Language | undefined;
  framework?: Framework | undefined;
  organization?: string | undefined;
  supportedMaturities?: MaturityLevel[] | undefined;
  defaultMaturity?: MaturityLevel | undefined;
  supportedCapabilities?: string[] | undefined;
  incompatibleCapabilities?: string[] | undefined;
  tags?: string[] | undefined;
  variables: BlueprintVariable[];
  entries: BlueprintEntry[];
  extensionPoints?: ExtensionPoint[] | undefined;
  maturityDefaults?: Partial<Record<MaturityLevel, string[]>> | undefined;
  featureTemplate?: {
    variables?: string[] | undefined;
    directories?: BlueprintDirectoryEntry[] | undefined;
    files?: BlueprintFileEntry[] | undefined;
    entries?: BlueprintEntry[] | undefined;
  } | undefined;
  metadata?: BlueprintMetadata | undefined;
}

export interface BlueprintRecord {
  blueprint: Blueprint;
  directory: string;
  manifestPath: string;
  vault: VaultLocation;
}

export interface PackRecord {
  pack: PackManifest;
  directory: string;
  manifestPath: string;
  vault: VaultLocation;
}

export interface ProfileRecord {
  profile: ProfileManifest;
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

export interface CatalogueRegistry {
  blueprints: BlueprintRecord[];
  packs: PackRecord[];
  profiles: ProfileRecord[];
  issues: RegistryIssue[];
}

export interface ProjectConfig {
  vaults?: string[] | undefined;
  defaultPreset?: string | undefined;
  output?: string | undefined;
  variables?: Record<string, Primitive> | undefined;
}

export interface LoadedConfig {
  path: string;
  directory: string;
  config: ProjectConfig;
}

export interface PlannedDirectory {
  type: "directory";
  relativePath: string;
  sourceResource?: string | undefined;
}

export interface PlannedFile {
  type: "file";
  relativePath: string;
  content: Uint8Array;
  mode?: number | undefined;
  sourceResource?: string | undefined;
  contentHash?: string | undefined;
}

export type PlannedEntry = PlannedDirectory | PlannedFile;

export interface GenerationPlan {
  blueprint: BlueprintRecord;
  maturity: MaturityLevel;
  profile?: ProfileRecord | undefined;
  packs: PackRecord[];
  targetDirectory: string;
  variables: Record<string, Primitive>;
  entries: PlannedEntry[];
  warnings?: string[] | undefined;
  conflicts?: string[] | undefined;
}

export interface GenerationResult {
  createdDirectories: string[];
  createdFiles: string[];
  overwrittenFiles: string[];
  metadataFile?: string | undefined;
  dryRun: boolean;
}

export interface CreateOptions {
  presetId?: string | undefined;
  profileId?: string | undefined;
  projectType?: ProjectType | undefined;
  language?: Language | undefined;
  framework?: Framework | undefined;
  maturity?: MaturityLevel | undefined;
  capabilities?: string[] | undefined;
  features?: string[] | undefined;
  output?: string | undefined;
  values: Record<string, Primitive>;
  force: boolean;
  dryRun: boolean;
  preview?: boolean | undefined;
  quick?: boolean | undefined;
  interactive: boolean;
  explicitVaults: string[];
  json: boolean;
  quiet?: boolean | undefined;
}

export interface CaptureReplacement {
  from: string;
  variable: string;
  prompt: string;
  transform?: VariableTransform | undefined;
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
