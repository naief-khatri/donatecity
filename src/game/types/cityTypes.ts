// Grid cell types
export type TerrainType = 'grass' | 'dirt' | 'water'
export type RoadType = 'straight' | 'corner' | 'tjunction' | 'fourway' | 'road_end'

// Road cell definition for the blueprint
export interface RoadCell {
  gridX: number
  gridY: number
  roadType: RoadType
  flipX?: boolean
}

// A single object on the city grid
export interface CityObject {
  id: string
  type: 'building' | 'road' | 'terrain' | 'plot'
  assetId: string
  gridX: number
  gridY: number
  width: number
  height: number
}

// Building data (one per unique campaign in a city)
export interface BuildingData {
  id: string
  campaignSlug: string
  campaignName: string
  organizationName?: string
  cause: string
  assetId: string
  level: number // 1-4
  totalDonated: number
  donationCount: number
  plotIndex: number // sequential slot number (1-based)
  gridX: number
  gridY: number
  lastDonationAt?: string
}

// Empty building plot waiting for a building
export interface BuildingPlot {
  plotIndex: number // 1-based sequential order
  gridX: number
  gridY: number
  width: number // in grid cells
  height: number // in grid cells
  occupied: boolean
  building?: BuildingData
}

// A single donation event
export interface DonationEvent {
  donationId: string
  campaignSlug: string
  campaignName: string
  organizationName?: string
  cause: string
  amount: number
  sequence: number // user-scoped order
  createdAt: string
  donatedById?: string
  donorMessage?: string
}

// Complete city state passed to Phaser
export interface CityState {
  cityId: string
  cityName: string
  ownerId: string
  layoutVersion: number
  cityLevel: number
  totalDonated: number
  campaignsSupported: number
  causesSupported: number
  gridSize: number
  terrain: TerrainType[][] // [row][col]
  roads: RoadCell[]
  plots: BuildingPlot[]
  buildings: BuildingData[]
  activeBounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

// Data shape from the server
export interface ServerCityData {
  city: {
    id: string
    owner_id: string
    name: string
    layout_version: number
    city_level: number
    total_donated: number
    campaigns_supported: number
    causes_supported: number
  }
  buildings: Array<{
    id: string
    city_id: string
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
    created_at: string
    updated_at: string
  }>
  donations: Array<{
    id: string
    campaign_slug: string
    campaign_name: string | null
    organization_name: string | null
    cause: string
    amount: number
    sequence: number
    created_at: string
    donated_by_id?: string | null
    donor_message?: string | null
  }>
  campaigns: Array<{
    id: string
    slug: string
    name: string
    description: string | null
    logo_url: string | null
    cause_category: string
    building_type: string
    is_active: boolean
  }>
  user: {
    id: string
    email: string
  }
}
