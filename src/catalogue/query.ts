import type {
  BlueprintRecord,
  CatalogueRegistry,
  Framework,
  Language,
  MaturityLevel,
  PackRecord,
  ProfileRecord,
  ProjectType
} from "../core/types.js";

export function queryBlueprints(
  catalogue: CatalogueRegistry,
  filter: {
    projectType?: ProjectType | undefined;
    language?: Language | undefined;
    framework?: Framework | undefined;
    id?: string | undefined;
  }
): BlueprintRecord[] {
  return catalogue.blueprints.filter((record) => {
    const bp = record.blueprint;
    if (filter.id && bp.id !== filter.id) return false;
    if (filter.projectType && bp.projectType && bp.projectType !== filter.projectType)
      return false;
    if (filter.language && bp.language && bp.language !== filter.language)
      return false;
    if (filter.framework && bp.framework && bp.framework !== filter.framework)
      return false;
    return true;
  });
}

export function queryPacks(
  catalogue: CatalogueRegistry,
  filter?: {
    category?: string | undefined;
    blueprintRecord?: BlueprintRecord | undefined;
    maturity?: MaturityLevel | undefined;
  }
): PackRecord[] {
  return catalogue.packs.filter((record) => {
    const pack = record.pack;
    if (filter?.category && pack.category !== filter.category) return false;

    if (filter?.blueprintRecord) {
      const bp = filter.blueprintRecord.blueprint;
      if (bp.incompatibleCapabilities?.includes(pack.id)) return false;
      if (
        bp.supportedCapabilities &&
        bp.supportedCapabilities.length > 0 &&
        !bp.supportedCapabilities.includes(pack.id)
      ) {
        return false;
      }
    }

    return true;
  });
}

export function findBlueprintById(
  catalogue: CatalogueRegistry,
  id: string
): BlueprintRecord | undefined {
  return catalogue.blueprints.find((b) => b.blueprint.id === id);
}

export function findPackById(
  catalogue: CatalogueRegistry,
  id: string
): PackRecord | undefined {
  return catalogue.packs.find((p) => p.pack.id === id);
}

export function findProfileById(
  catalogue: CatalogueRegistry,
  id: string
): ProfileRecord | undefined {
  return catalogue.profiles.find((p) => p.profile.id === id);
}
