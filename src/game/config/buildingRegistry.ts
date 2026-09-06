export interface BuildingRegistryEntry {
  displayName: string
}

export const BUILDING_REGISTRY: Record<string, BuildingRegistryEntry> = {
  climate: { displayName: 'Eco Center' },
  'mental-health': { displayName: 'Wellness Clinic' },
  water: { displayName: 'Water Station' },
  wildfires: { displayName: 'Fire Station' },
  refugees: { displayName: 'Shelter' },
  energy: { displayName: 'Power Plant' },
  health: { displayName: 'Hospital' },
  children: { displayName: 'Youth Center' },
  food: { displayName: 'Food Center' },
  education: { displayName: 'School' },
  animals: { displayName: 'Animal Shelter' },
}

export const DEFAULT_BUILDING: BuildingRegistryEntry = {
  displayName: 'Community Center',
}

export function getBuildingEntry(cause: string): BuildingRegistryEntry {
  return BUILDING_REGISTRY[cause] ?? DEFAULT_BUILDING
}

export function getBuildingAssetKey(cause: string, level: number): string {
  return `${cause}_lvl${level}`
}

export function getBuildingAssetUrl(cause: string, level: number): string {
  return `/assets/buildings/${getBuildingAssetKey(cause, level)}.png`
}
