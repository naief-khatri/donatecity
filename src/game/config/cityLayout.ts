import type { TerrainType, RoadCell, BuildingPlot } from '@/game/types/cityTypes'
import { INITIAL_GRID_SIZE } from '@/game/config/cityConfig'

/**
 * Generate the terrain grid for the initial city.
 * - Outer 2-tile border = water
 * - Next 1-tile ring = dirt (shore)
 * - Everything else = grass
 */
import { MAX_GRID_SIZE } from '@/game/config/cityConfig'

/**
 * Generate a massive MAX_GRID_SIZE terrain grid.
 * We will only render a subset of this dynamically.
 */
export function generateTerrain(): TerrainType[][] {
  const terrain: TerrainType[][] = [];
  for (let y = 0; y < MAX_GRID_SIZE; y++) {
    const row: TerrainType[] = [];
    for (let x = 0; x < MAX_GRID_SIZE; x++) {
      row.push('grass');
    }
    terrain.push(row);
  }
  return terrain;
}

export function generateRoads(): RoadCell[] {
  return [];
}

/**
 * Generate 1x1 plots radiating outward from the center.
 */
export function generatePlots(): BuildingPlot[] {
  const plots: Omit<BuildingPlot, 'plotIndex'>[] = [];
  
  const plotSize = 1;
  const gap = 1;
  const step = plotSize + gap;
  const center = Math.floor(MAX_GRID_SIZE / 2);

  // Generate all possible plots on the grid
  for (let y = 0; y < MAX_GRID_SIZE - plotSize; y += step) {
    for (let x = 0; x < MAX_GRID_SIZE - plotSize; x += step) {
      plots.push({
        gridX: x,
        gridY: y,
        width: plotSize,
        height: plotSize,
        occupied: false
      });
    }
  }

  // Sort by Chebyshev distance from center, then Manhattan distance as tiebreaker
  plots.sort((a, b) => {
    const aDist = Math.max(Math.abs(a.gridX - center), Math.abs(a.gridY - center));
    const bDist = Math.max(Math.abs(b.gridX - center), Math.abs(b.gridY - center));
    
    if (aDist !== bDist) return aDist - bDist;
    
    // Tiebreaker: Manhattan distance
    const aMan = Math.abs(a.gridX - center) + Math.abs(a.gridY - center);
    const bMan = Math.abs(b.gridX - center) + Math.abs(b.gridY - center);
    
    if (aMan !== bMan) return aMan - bMan;
    
    // Stable tiebreaker
    return (a.gridY * MAX_GRID_SIZE + a.gridX) - (b.gridY * MAX_GRID_SIZE + b.gridX);
  });

  // Assign sequential plotIndex
  return plots.map((p, i) => ({
    ...p,
    plotIndex: i + 1
  }));
}

/**
 * Master function: generate the complete layout.
 */
export function generateCityLayout(version: number = 1) {
  return {
    version,
    gridSize: MAX_GRID_SIZE,
    terrain: generateTerrain(),
    roads: generateRoads(),
    plots: generatePlots(),
  }
}
