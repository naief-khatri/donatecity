export interface BuildingRegistryEntry {
  assetKey: string  // maps to ASSET_KEYS key
  displayName: string
  hasAsset: boolean // whether a dedicated PNG exists for this cause
}

export const BUILDING_REGISTRY: Record<string, BuildingRegistryEntry> = {
  climate: { assetKey: 'climate_base', displayName: 'Eco Center', hasAsset: true },
  'mental-health': { assetKey: 'climate_base', displayName: 'Wellness Clinic', hasAsset: false },
  water: { assetKey: 'climate_base', displayName: 'Water Station', hasAsset: false },
  wildfires: { assetKey: 'climate_base', displayName: 'Fire Station', hasAsset: false },
  refugees: { assetKey: 'climate_base', displayName: 'Shelter', hasAsset: false },
  energy: { assetKey: 'climate_base', displayName: 'Power Plant', hasAsset: false },
  health: { assetKey: 'climate_base', displayName: 'Hospital', hasAsset: false },
  children: { assetKey: 'climate_base', displayName: 'Youth Center', hasAsset: false },
  food: { assetKey: 'climate_base', displayName: 'Food Center', hasAsset: false },
  education: { assetKey: 'climate_base', displayName: 'School', hasAsset: false },
  animals: { assetKey: 'climate_base', displayName: 'Animal Shelter', hasAsset: false },
}

export const DEFAULT_BUILDING: BuildingRegistryEntry = {
  assetKey: 'climate_base',
  displayName: 'Community Center',
  hasAsset: false,
}

export function getBuildingEntry(cause: string): BuildingRegistryEntry {
  return BUILDING_REGISTRY[cause] ?? DEFAULT_BUILDING
}
