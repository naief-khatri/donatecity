export const CITY_LAYOUT_VERSION = 1

// Display tile dimensions (source images are 1536x1024)
// Isometric tiles use 2:1 width:height ratio
export const TILE_WIDTH = 128
export const TILE_HEIGHT = 64

// Source image dimensions
export const SOURCE_WIDTH = 1536
export const SOURCE_HEIGHT = 1024

// Grid sizes
export const INITIAL_GRID_SIZE = 24
export const MAX_GRID_SIZE = 64

// Building level thresholds (cumulative donation amount in dollars)
export const BUILDING_LEVEL_THRESHOLDS: { maxAmount: number; level: number }[] = [
  { maxAmount: 25, level: 1 },
  { maxAmount: 75, level: 2 },
  { maxAmount: 150, level: 3 },
  // anything above 150 -> level 4
]
export const MAX_BUILDING_LEVEL = 4

// City expansion
export const EXPANSION_OCCUPANCY_THRESHOLD = 0.8
export const EXPANSION_SIZE_INCREMENT = 8

// Camera
export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 2.0
export const DEFAULT_ZOOM = 0.6

export const ASSET_KEYS = {
  grass: { key: 'grass_tile', path: '/assets/tiles/grass_tile.png' },
  dirt: { key: 'dirt_tile', path: '/assets/tiles/dirt_tile.png' },
  water: { key: 'water_tile', path: '/assets/tiles/water_tile.png' },
  road_straight: { key: 'road_straight', path: '/assets/tiles/straight road.png' },
  road_corner: { key: 'road_corner', path: '/assets/tiles/corner.png' },
  road_tjunction: { key: 'road_tjunction', path: '/assets/tiles/tjunction.png' },
  road_fourway: { key: 'road_fourway', path: '/assets/tiles/fourway.png' },
  road_end: { key: 'road_end', path: '/assets/tiles/road end.png' },
  climate_base: { key: 'climate_base', path: '/assets/buildings/climate_base.png' },
} as const

export type AssetKey = keyof typeof ASSET_KEYS
