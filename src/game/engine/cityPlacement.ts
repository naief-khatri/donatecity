import type { DonationEvent, BuildingData, BuildingPlot } from '@/game/types/cityTypes'
import { BUILDING_LEVEL_THRESHOLDS, MAX_BUILDING_LEVEL } from '@/game/config/cityConfig'
import { getBuildingEntry } from '@/game/config/buildingRegistry'

/**
 * Calculate building level from cumulative donation amount.
 * $0-25 → 1, $26-75 → 2, $76-150 → 3, $151+ → 4
 */
export function calculateBuildingLevel(totalDonated: number): number {
  for (const threshold of BUILDING_LEVEL_THRESHOLDS) {
    if (totalDonated <= threshold.maxAmount) {
      return threshold.level
    }
  }
  return MAX_BUILDING_LEVEL
}

/**
 * Given an ordered list of donations, build the complete deterministic city.
 *
 * Algorithm:
 * 1. Process donations in sequence order (must be pre-sorted)
 * 2. Track unique campaigns in first-appearance order
 * 3. For each unique campaign: assign next available plot, sum amounts, count donations
 * 4. Calculate level from total
 *
 * INVARIANTS:
 * - No Math.random()
 * - No userId in the logic
 * - Same input → same output, always
 * - Buildings never change plot once assigned
 */
export function buildCityFromDonations(
  donations: DonationEvent[],
  plots: BuildingPlot[]
): { buildings: BuildingData[]; plots: BuildingPlot[] } {
  // Deep copy plots so we don't mutate the original
  const updatedPlots = plots.map(p => ({ ...p }))

  // Track campaigns in first-appearance order
  const campaignOrder: string[] = []
  const campaignMap = new Map<string, {
    total: number
    count: number
    lastDate: string
    plot: BuildingPlot
    cause: string
    campaignName: string
    organizationName?: string
  }>()

  // Process donations in sequence order
  for (const donation of donations) {
    if (!campaignMap.has(donation.campaignSlug)) {
      // First time seeing this campaign — assign next plot
      const nextPlot = getNextAvailablePlot(updatedPlots)
      if (!nextPlot) continue // No more plots available

      nextPlot.occupied = true
      campaignOrder.push(donation.campaignSlug)
      campaignMap.set(donation.campaignSlug, {
        total: 0,
        count: 0,
        lastDate: donation.createdAt,
        plot: nextPlot,
        cause: donation.cause,
        campaignName: donation.campaignName || donation.campaignSlug,
        organizationName: donation.organizationName,
      })
    }

    // Accumulate donation data
    const data = campaignMap.get(donation.campaignSlug)!
    data.total += donation.amount
    data.count += 1
    // Track the most recent donation date
    if (donation.createdAt > data.lastDate) {
      data.lastDate = donation.createdAt
    }
  }

  // Build the buildings array in campaign-appearance order
  const buildings: BuildingData[] = campaignOrder.map(slug => {
    const data = campaignMap.get(slug)!
    const level = calculateBuildingLevel(data.total)
    const entry = getBuildingEntry(data.cause)

    return {
      id: `building_${slug}_${data.plot.plotIndex}`,
      campaignSlug: slug,
      campaignName: data.campaignName,
      organizationName: data.organizationName,
      cause: data.cause,
      assetId: entry.assetKey,
      level,
      totalDonated: data.total,
      donationCount: data.count,
      gridX: data.plot.gridX,
      gridY: data.plot.gridY,
      plotIndex: data.plot.plotIndex,
      lastDonationAt: data.lastDate,
    }
  })

  return { buildings, plots: updatedPlots }
}

/**
 * Find the next unoccupied plot in sequential order.
 * Returns null if all plots are full.
 */
export function getNextAvailablePlot(plots: BuildingPlot[]): BuildingPlot | null {
  // Plots are already sorted by plotIndex
  for (const plot of plots) {
    if (!plot.occupied) {
      return plot
    }
  }
  return null
}

/**
 * Convert server-side city_buildings rows to BuildingData objects.
 * Used when loading an existing city from the database (cached layout).
 */
export function serverBuildingsToData(
  serverBuildings: Array<{
    id: string
    campaign_slug: string
    campaign_name: string | null
    cause: string
    asset_id: string
    level: number
    total_donated: number
    donation_count: number
    grid_x: number
    grid_y: number
    plot_index: number
    updated_at: string
  }>
): BuildingData[] {
  return serverBuildings.map(b => ({
    id: b.id,
    campaignSlug: b.campaign_slug,
    campaignName: b.campaign_name ?? b.campaign_slug,
    cause: b.cause,
    assetId: b.asset_id,
    level: b.level,
    totalDonated: Number(b.total_donated),
    donationCount: b.donation_count,
    gridX: b.grid_x,
    gridY: b.grid_y,
    plotIndex: b.plot_index,
    lastDonationAt: b.updated_at,
  }))
}
