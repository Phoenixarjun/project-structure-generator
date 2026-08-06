import type {
  BlueprintRecord,
  CatalogueRegistry,
  PackRecord,
  ProfileRecord,
  RegistryIssue,
  VaultLocation
} from "../core/types.js";
import { loadCatalogueFromVault } from "./loader.js";

export async function loadCatalogue(
  vaultLocations: VaultLocation[]
): Promise<CatalogueRegistry> {
  const combined: CatalogueRegistry = {
    blueprints: [],
    packs: [],
    profiles: [],
    issues: []
  };

  const blueprintMap = new Map<string, BlueprintRecord>();
  const packMap = new Map<string, PackRecord>();
  const profileMap = new Map<string, ProfileRecord>();

  for (const vault of vaultLocations) {
    const vaultRegistry = await loadCatalogueFromVault(vault);

    for (const issue of vaultRegistry.issues) {
      combined.issues.push(issue);
    }

    for (const blueprintRecord of vaultRegistry.blueprints) {
      const id = blueprintRecord.blueprint.id;
      if (!blueprintMap.has(id)) {
        blueprintMap.set(id, blueprintRecord);
      }
    }

    for (const packRecord of vaultRegistry.packs) {
      const id = packRecord.pack.id;
      if (!packMap.has(id)) {
        packMap.set(id, packRecord);
      }
    }

    for (const profileRecord of vaultRegistry.profiles) {
      const id = profileRecord.profile.id;
      if (!profileMap.has(id)) {
        profileMap.set(id, profileRecord);
      }
    }
  }

  combined.blueprints = Array.from(blueprintMap.values()).sort((a, b) =>
    a.blueprint.id.localeCompare(b.blueprint.id)
  );

  combined.packs = Array.from(packMap.values()).sort((a, b) =>
    a.pack.id.localeCompare(b.pack.id)
  );

  combined.profiles = Array.from(profileMap.values()).sort((a, b) =>
    a.profile.id.localeCompare(b.profile.id)
  );

  return combined;
}
