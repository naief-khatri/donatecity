'use client'

import { create } from 'zustand'
import type {
  CityState,
  BuildingData,
  BuildingPlot,
  DonationEvent,
  ServerCityData,
} from '@/game/types/cityTypes'
import { generateCityLayout } from '@/game/config/cityLayout'
import { buildCityFromDonations, serverBuildingsToData } from '@/game/engine/cityPlacement'
import { CITY_LAYOUT_VERSION } from '@/game/config/cityConfig'

type ModalType = 'campaigns' | 'leaderboard' | 'profile' | 'settings' | null

interface CityStore {
  // City data
  userId: string | null
  userEmail: string | null
  cityId: string | null
  cityName: string
  layoutVersion: number
  cityLevel: number
  totalDonated: number
  campaignsSupported: number
  causesSupported: number

  // Derived city objects
  buildings: BuildingData[]
  plots: BuildingPlot[]
  donations: DonationEvent[]
  cityState: CityState | null

  // Campaign data (for modal)
  campaigns: ServerCityData['campaigns']

  // UI state
  selectedBuilding: BuildingData | null
  activeModal: ModalType
  showBuildingModal: boolean

  // Visiting state
  isVisitingCity: boolean
  visitingUserId: string | null
  visitingCityName: string | null
  originalCityState: CityState | null
  originalDonations: DonationEvent[] | null

  // Actions
  initializeCity: (serverData: ServerCityData) => void
  selectBuilding: (building: BuildingData | null) => void
  openModal: (modal: ModalType) => void
  closeModal: () => void
  closeBuildingModal: () => void
  addDonationAndBuilding: (donation: DonationEvent, building: BuildingData) => void
  enterVisitMode: (userId: string, cityName: string, visitCityState: CityState, visitDonations: DonationEvent[]) => void
  exitVisitMode: () => void
  zoomCamera: (delta: number) => void
  visitCity: (userId: string) => Promise<void>
  resetCamera: () => void

  // Internal ref for Phaser scene
  _phaserScene: unknown | null
  _setPhaserScene: (scene: unknown) => void
}

export const useCityStore = create<CityStore>((set, get) => ({
  // Initial state
  userId: null,
  userEmail: null,
  cityId: null,
  cityName: 'My City',
  layoutVersion: CITY_LAYOUT_VERSION,
  cityLevel: 1,
  totalDonated: 0,
  campaignsSupported: 0,
  causesSupported: 0,
  buildings: [],
  plots: [],
  donations: [],
  campaigns: [],
  cityState: null,
  originalCityState: null,
        originalDonations: null,
  
  activeModal: null,
  showBuildingModal: false,
  selectedBuilding: null,

  isVisitingCity: false,
  visitingUserId: null,
  visitingCityName: null,
  _phaserScene: null,

  _setPhaserScene: (scene) => set({ _phaserScene: scene }),

  initializeCity: (serverData: ServerCityData) => {
    const { city, donations: serverDonations, campaigns, user } = serverData

    // Generate the baseline layout (terrain, roads, empty plots)
    const layout = generateCityLayout(city.layout_version ?? CITY_LAYOUT_VERSION)

    // Convert server donations to DonationEvent
    const donations: DonationEvent[] = (serverDonations ?? []).map(d => ({
      donationId: d.id,
      campaignSlug: d.campaign_slug,
      campaignName: d.campaign_name ?? '',
      organizationName: d.organization_name ?? undefined,
      cause: d.cause,
      amount: Number(d.amount),
      sequence: d.sequence,
      createdAt: d.created_at,
      donatedById: d.donated_by_id || undefined,
      donorMessage: d.donor_message || undefined,
    }))
    
    // Sort donations by sequence to ensure deterministic order
    donations.sort((a, b) => a.sequence - b.sequence)

    // Run deterministic placement engine
    const { buildings, plots } = buildCityFromDonations(donations, layout.plots)

    // Compute active bounds
    const center = Math.floor(layout.gridSize / 2)
    let minX = center - 3
    let maxX = center + 3
    let minY = center - 3
    let maxY = center + 3

    for (const plot of plots) {
      if (plot.occupied) {
        minX = Math.min(minX, plot.gridX - 3)
        maxX = Math.max(maxX, plot.gridX + 3)
        minY = Math.min(minY, plot.gridY - 3)
        maxY = Math.max(maxY, plot.gridY + 3)
      }
    }

    minX = Math.max(0, minX)
    maxX = Math.min(layout.gridSize - 1, maxX)
    minY = Math.max(0, minY)
    maxY = Math.min(layout.gridSize - 1, maxY)

    const uniqueCampaigns = new Set(buildings.map(b => b.campaignSlug))
    const uniqueCauses = new Set(buildings.map(b => b.cause))
    const calculatedTotalDonated = buildings.reduce((sum, b) => sum + (b.totalDonated || 0), 0)

    // Build complete city state
    const cityState: CityState = {
      cityId: city.id,
      cityName: city.name,
      ownerId: city.owner_id,
      layoutVersion: city.layout_version ?? CITY_LAYOUT_VERSION,
      cityLevel: city.city_level ?? 1,
      totalDonated: calculatedTotalDonated,
      campaignsSupported: uniqueCampaigns.size,
      causesSupported: uniqueCauses.size,
      gridSize: layout.gridSize,
      terrain: layout.terrain,
      roads: layout.roads,
      plots,
      buildings,
      activeBounds: { minX, maxX, minY, maxY }
    }

    set({
      userId: user.id,
      userEmail: user.email,
      cityId: city.id,
      cityName: city.name,
      layoutVersion: cityState.layoutVersion,
      cityLevel: cityState.cityLevel,
      totalDonated: cityState.totalDonated,
      campaignsSupported: cityState.campaignsSupported,
      causesSupported: cityState.causesSupported,
      buildings,
      plots,
      donations,
      campaigns,
      cityState,
      originalCityState: null,
    })
  },

  selectBuilding: (building) => set({ selectedBuilding: building, showBuildingModal: !!building }),

  openModal: (modal) => set({ activeModal: modal }),

  closeModal: () => set({ activeModal: null }),

  closeBuildingModal: () => set({ showBuildingModal: false, selectedBuilding: null }),

  addDonationAndBuilding: (donation, building) => {
    const state = get()
    const newDonations = [...state.donations, donation]
    const { buildings: newBuildings, plots: newPlots } = buildCityFromDonations(newDonations, state.plots)
    
    // Calculate new totals
    const totalDonated = newBuildings.reduce((sum, b) => sum + (b.totalDonated || 0), 0)
    const uniqueCampaigns = new Set(newBuildings.map(b => b.campaignSlug))
    const uniqueCauses = new Set(newBuildings.map(b => b.cause))
    
    set({
      donations: newDonations,
      buildings: newBuildings,
      plots: newPlots,
      totalDonated,
      campaignsSupported: uniqueCampaigns.size,
      causesSupported: uniqueCauses.size,
    })

    // Notify Phaser scene to animate the building
    const scene = state._phaserScene as { addBuilding?: (d: BuildingData) => void } | null
    if (scene?.addBuilding) {
      scene.addBuilding(building)
    }
  },

  enterVisitMode: (userId, cityName, visitCityState, visitDonations) => {
    const currentState = get()
    set({
      isVisitingCity: true,
      visitingUserId: userId,
      visitingCityName: cityName,
      originalCityState: currentState.cityState,
      originalDonations: currentState.donations,
      cityState: visitCityState,
      activeModal: null,
      showBuildingModal: false,
      
      // Override UI root values for visiting
      cityName: visitCityState.cityName,
      cityLevel: visitCityState.cityLevel,
      totalDonated: visitCityState.totalDonated,
      campaignsSupported: visitCityState.campaignsSupported,
      causesSupported: visitCityState.causesSupported,
      buildings: visitCityState.buildings,
      donations: visitDonations
    })
  },

  zoomCamera: (delta) => {
    const scene = get()._phaserScene as { applyZoomDelta?: (d: number) => void } | null
    if (scene?.applyZoomDelta) {
      scene.applyZoomDelta(delta)
    }
  },

  exitVisitMode: () => {
    const currentState = get()
    const original = currentState.originalCityState
    if (original) {
      set({
        isVisitingCity: false,
        visitingUserId: null,
        visitingCityName: null,
        cityState: original,
        originalCityState: null,
        
        // Restore UI root values
        cityName: original.cityName,
        cityLevel: original.cityLevel,
        totalDonated: original.totalDonated,
        campaignsSupported: original.campaignsSupported,
        causesSupported: original.causesSupported,
        buildings: original.buildings,
        donations: currentState.originalDonations || currentState.donations
      })
    }
  },

  visitCity: async (userId: string) => {
    try {
      const res = await fetch(`/api/city/${userId}`)
      if (!res.ok) throw new Error('Failed to load city')
      const { city, donations: serverDonations } = await res.json()
      
      const mappedDonations: DonationEvent[] = (serverDonations ?? []).map((d: any) => ({
        donationId: d.id,
        campaignSlug: d.campaign_slug,
        campaignName: d.campaign_name ?? '',
        organizationName: d.organization_name ?? undefined,
        cause: d.cause,
        amount: Number(d.amount),
        sequence: d.sequence,
        createdAt: d.created_at,
      }))
      
      const layout = generateCityLayout(city.layout_version ?? CITY_LAYOUT_VERSION)
      const { buildings, plots } = buildCityFromDonations(mappedDonations, layout.plots)
      
      const center = Math.floor(layout.gridSize / 2)
      let minX = center - 3, maxX = center + 3, minY = center - 3, maxY = center + 3
      for (const plot of plots) {
        if (plot.occupied) {
          minX = Math.min(minX, plot.gridX - 3)
          maxX = Math.max(maxX, plot.gridX + 3)
          minY = Math.min(minY, plot.gridY - 3)
          maxY = Math.max(maxY, plot.gridY + 3)
        }
      }
      minX = Math.max(0, minX); maxX = Math.min(layout.gridSize - 1, maxX)
      minY = Math.max(0, minY); maxY = Math.min(layout.gridSize - 1, maxY)

      const uniqueCampaigns = new Set(buildings.map(b => b.campaignSlug))
      const uniqueCauses = new Set(buildings.map(b => b.cause))
      const calculatedTotalDonated = buildings.reduce((sum, b) => sum + (b.totalDonated || 0), 0)

      const cityState: CityState = {
        cityId: city.id,
        cityName: city.name,
        ownerId: city.owner_id,
        layoutVersion: city.layout_version ?? CITY_LAYOUT_VERSION,
        cityLevel: city.city_level ?? 1,
        totalDonated: calculatedTotalDonated,
        campaignsSupported: uniqueCampaigns.size,
        causesSupported: uniqueCauses.size,
        gridSize: layout.gridSize,
        terrain: layout.terrain,
        roads: layout.roads,
        plots,
        buildings,
        activeBounds: { minX, maxX, minY, maxY }
      }

      get().enterVisitMode(userId, city.name, cityState, mappedDonations)
    } catch (err) {
      console.error(err)
      alert("Failed to visit city.")
    }
  },

  resetCamera: () => {
    const scene = get()._phaserScene as { resetCamera?: () => void } | null
    if (scene?.resetCamera) {
      scene.resetCamera()
    }
  },
}))
