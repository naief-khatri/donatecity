import Phaser from 'phaser'
import type { CityState, BuildingData, BuildingPlot, RoadCell, TerrainType } from '@/game/types/cityTypes'
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  ASSET_KEYS,
} from "@/game/config/cityConfig"
import { getBuildingAssetKey } from "@/game/config/buildingRegistry"

export default class CityScene extends Phaser.Scene {
  private cityState!: CityState
  private buildingSprites: Map<string, Phaser.GameObjects.Image> = new Map()
  private plotMarkers: Map<number, Phaser.GameObjects.Image> = new Map()
  private targetZoom = 1;
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0

  constructor() {
    super('CityScene')
  }

  init(data: CityState) {
    this.cityState = data
  }

  create() {
    const gridSize = this.cityState.gridSize

    // Calculate world bounds in screen space
    const worldBounds = this.getWorldBounds()
    this.cameras.main.setBounds(
      worldBounds.minX - 200,
      worldBounds.minY - 200,
      worldBounds.width + 400,
      worldBounds.height + 400
    )

    // Render layers in depth order based on the logical map
    this.renderLogicalMap()

    // Setup camera
    this.setupCamera(worldBounds)

    // Setup input
    this.setupInput()

    // Render debug grid if enabled
    this.renderDebugGrid()
  }

  // ─── Isometric Helpers ─────────────────────────────────────────────

  private cartToIso(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: (gridX - gridY) * (TILE_WIDTH / 2),
      y: (gridX + gridY) * (TILE_HEIGHT / 2),
    }
  }

  private getWorldBounds() {
    // Calculate the bounding box of the active isometric tiles
    const bounds = this.cityState.activeBounds || {
      minX: 0,
      maxX: this.cityState.gridSize - 1,
      minY: 0,
      maxY: this.cityState.gridSize - 1
    }

    const topLeft = this.cartToIso(bounds.minX, bounds.minY)
    const topRight = this.cartToIso(bounds.maxX, bounds.minY)
    const bottomLeft = this.cartToIso(bounds.minX, bounds.maxY)
    const bottomRight = this.cartToIso(bounds.maxX, bounds.maxY)

    const minX = Math.min(topLeft.x, bottomLeft.x)
    const maxX = Math.max(topRight.x, bottomRight.x)
    const minY = Math.min(topLeft.y, topRight.y)
    const maxY = Math.max(bottomLeft.y, bottomRight.y) + TILE_HEIGHT / 2

    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY }
  }

  private calcDepth(x: number, y: number, layer: number): number {
    return (x + y) * 10 + layer
  }

  // ─── Unified Asset Placement ─────────────────────────────────────────


  private placeAsset(
    assetKey: string,
    gridX: number,
    gridY: number,
    width: number,
    height: number,
    layerOffset: number,
    flipX: boolean = false
  ): Phaser.GameObjects.Image {
    const centerX = gridX + (width - 1) / 2
    const centerY = gridY + (height - 1) / 2
    
    const { x, y } = this.cartToIso(centerX, centerY)

    const sprite = this.add.image(x, y, assetKey)
    
    if (layerOffset < 3) {
      // Base terrain (grass, dirt, roads)
      // The user uploaded manually adjusted 2D assets which have different alpha bounding boxes.
      // We calculate the scale such that the visible pixels exactly fill 128x64.
      if (assetKey === ASSET_KEYS.grass.key) {
        // True visual diamond: 1220x855
        sprite.setDisplaySize(161.18, 76.65)
      } else if (assetKey === ASSET_KEYS.dirt.key) {
        // True visual diamond: 1375x852
        // Width: 1536 * (128 / 1375) = 143.01
        // Height: 1024 * (64 / 852) = 76.92
        sprite.setDisplaySize(143.01, 76.92)
      } else {
        // Fallback for roads/water - assuming they roughly match grass for now
        sprite.setDisplaySize(161.18, 76.65)
      }
      sprite.setOrigin(0.5, 0.5)
    } else {
      // Buildings (layerOffset >= 3)
      // Buildings are tall and should not be squashed to 64px height!
      // We apply the pure scale factor (128 / 1220 = 0.1049).
      // Force all buildings to render at a consistent width, preventing scale mismatches
      // if we resize the raw asset to fix aliasing.
      const targetWidth = 1536 * 0.1049;
      sprite.displayWidth = targetWidth;
      sprite.scaleY = sprite.scaleX;
      
      // Buildings should be anchored at their base. Assuming base near bottom:
      sprite.setOrigin(0.5, 0.75);
    }

    if (gridX === 0 && gridY === 0) {
      console.log(`[DEBUG] Tile (0,0): pos=(${x}, ${y}), displaySize=(${sprite.displayWidth}, ${sprite.displayHeight})`)
    }
    if (gridX === 1 && gridY === 0) {
      console.log(`[DEBUG] Tile (1,0): pos=(${x}, ${y}), displaySize=(${sprite.displayWidth}, ${sprite.displayHeight})`)
    }

    if (flipX) {
      sprite.setFlipX(true)
    }

    const maxGridX = gridX + width - 1
    const maxGridY = gridY + height - 1
    sprite.setDepth(this.calcDepth(maxGridX, maxGridY, layerOffset))

    return sprite
  }

  // ─── Logical Map Generation & Rendering ──────────────────────────────

  private renderLogicalMap() {
    const gridSize = this.cityState.gridSize

    type LogicalTile = {
      terrain?: TerrainType
      road?: RoadCell
    }
    const logicalMap: LogicalTile[][] = Array.from({ length: gridSize }, () => 
      Array.from({ length: gridSize }, () => ({}))
    )

    const bounds = this.cityState.activeBounds || {
      minX: 0, maxX: gridSize - 1, minY: 0, maxY: gridSize - 1
    }

    // 1. Fill base terrain within active bounds
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        logicalMap[y][x].terrain = this.cityState.terrain[y][x]
      }
    }



    // 3. Roads replace terrain
    for (const road of this.cityState.roads) {
      if (road.gridY >= 0 && road.gridY < gridSize && road.gridX >= 0 && road.gridX < gridSize) {
        logicalMap[road.gridY][road.gridX].road = road
        delete logicalMap[road.gridY][road.gridX].terrain // Road replaces grass/dirt
      } else {
        console.warn(`[Map Validation] Road out of bounds at ${road.gridX}, ${road.gridY}`)
      }
    }

    // 4. Validate plots and buildings
    const occupiedCells = new Set<string>()
    for (const plot of this.cityState.plots) {
      for (let py = 0; py < plot.height; py++) {
        for (let px = 0; px < plot.width; px++) {
          const gx = plot.gridX + px
          const gy = plot.gridY + py
          const key = `${gx},${gy}`
          if (occupiedCells.has(key)) {
            console.error(`[Map Validation] Overlap detected at ${key}`)
          }
          if (logicalMap[gy]?.[gx]?.road) {
            console.error(`[Map Validation] Plot overlapping road at ${key}`)
          }
          occupiedCells.add(key)
        }
      }
    }

    // 5. Render base layer (exactly ONE sprite per cell)
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = logicalMap[y][x]
        
        if (tile.road) {
          const assetKey = this.getRoadAssetKey(tile.road)
          this.placeAsset(assetKey, x, y, 1, 1, 0, tile.road.flipX)
        } else if (tile.terrain) {
          const assetKey = this.getTerrainAssetKey(tile.terrain)
          this.placeAsset(assetKey, x, y, 1, 1, 0)
        }
      }
    }

    // 6. Render buildings (as separate game objects anchored to footprints)
    for (const building of this.cityState.buildings) {
      this.createBuildingSprite(building, false)
    }
  }

  private getTerrainAssetKey(type: TerrainType): string {
    switch (type) {
      case 'water': return ASSET_KEYS.water.key
      case 'dirt': return ASSET_KEYS.dirt.key
      case 'grass': return ASSET_KEYS.grass.key
    }
  }

  private getRoadAssetKey(road: RoadCell): string {
    switch (road.roadType) {
      case 'straight': return ASSET_KEYS.road_straight.key
      case 'corner': return ASSET_KEYS.road_corner.key
      case 'tjunction': return ASSET_KEYS.road_tjunction.key
      case 'fourway': return ASSET_KEYS.road_fourway.key
      case 'road_end': return ASSET_KEYS.road_end.key
    }
  }

  private createBuildingSprite(building: BuildingData, animate: boolean) {
    const plot = this.cityState.plots.find(p => p.plotIndex === building.plotIndex)
    const existingMarker = this.plotMarkers.get(building.plotIndex)
    if (existingMarker) {
      existingMarker.destroy()
      this.plotMarkers.delete(building.plotIndex)
    }

    const existingBuilding = this.buildingSprites.get(building.campaignSlug)
    if (existingBuilding) {
      existingBuilding.destroy()
      this.buildingSprites.delete(building.campaignSlug)
    }

    const plotWidth = plot?.width ?? 1
    const plotHeight = plot?.height ?? 1

    const desiredAssetKey = getBuildingAssetKey(building.cause, building.level)
    let renderKey = desiredAssetKey
    let needsGeneration = false
    
    if (!this.textures.exists(desiredAssetKey)) {
       needsGeneration = true
       if (building.level > 1 && this.textures.exists(getBuildingAssetKey(building.cause, building.level - 1))) {
           renderKey = getBuildingAssetKey(building.cause, building.level - 1)
       } else {
           renderKey = 'building_new_placeholder'
       }
    }

    const sprite = this.placeAsset(
      renderKey,
      building.gridX,
      building.gridY,
      plotWidth,
      plotHeight,
      3
    )
    
    if (needsGeneration) {
       sprite.setAlpha(0.6)
       this.triggerBuildingGeneration(building, sprite, desiredAssetKey)
    }

    // Make interactive
    sprite.setInteractive({ useHandCursor: true })
    sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) {
        this.events.emit('building-clicked', building)
      }
    })

    const baseScale = sprite.scale
    sprite.on('pointerover', () => {
      sprite.setTint(0xddffdd)
      sprite.setScale(baseScale * 1.05)
    })
    sprite.on('pointerout', () => {
      sprite.clearTint()
      sprite.setScale(baseScale)
    })

    this.buildingSprites.set(building.campaignSlug, sprite)

    if (animate) {
      sprite.setScale(0)
      sprite.setAlpha(0)
      this.tweens.add({
        targets: sprite,
        scaleX: baseScale,
        scaleY: baseScale,
        alpha: 1,
        duration: 600,
        ease: 'Back.easeOut',
      })
    }
  }

  // ─── Debug Grid ────────────────────────────────────────────────────

  private renderDebugGrid() {
    // Only render if a global window flag is set (can be toggled in console)
    if (!(window as any).DEBUG_GRID) return

    const graphics = this.add.graphics()
    graphics.lineStyle(1, 0xff0000, 0.8)
    graphics.setDepth(10000)

    const gridSize = this.cityState.gridSize
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const c1 = this.cartToIso(col - 0.5, row - 0.5)
        const c2 = this.cartToIso(col + 0.5, row - 0.5)
        const c3 = this.cartToIso(col + 0.5, row + 0.5)
        const c4 = this.cartToIso(col - 0.5, row + 0.5)
        
        const p1 = new Phaser.Math.Vector2(c1.x, c1.y)
        const p2 = new Phaser.Math.Vector2(c2.x, c2.y)
        const p3 = new Phaser.Math.Vector2(c3.x, c3.y)
        const p4 = new Phaser.Math.Vector2(c4.x, c4.y)

        graphics.strokePoints([p1, p2, p3, p4, p1])
        
        const center = this.cartToIso(col, row)
        this.add.text(center.x, center.y, `${col},${row}`, { 
          fontSize: '10px', 
          color: '#ffffff' 
        }).setOrigin(0.5).setDepth(10001)
      }
    }
  }

  // ─── Camera Setup ──────────────────────────────────────────────────

  private setupCamera(worldBounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number }) {
    const camera = this.cameras.main

    // Calculate zoom to fit entire city
    const zoomX = this.scale.width / worldBounds.width
    const zoomY = this.scale.height / worldBounds.height
    const fitZoom = Math.min(zoomX, zoomY) * 0.85
    const initialZoom = Math.max(fitZoom, DEFAULT_ZOOM)
    this.targetZoom = Phaser.Math.Clamp(initialZoom, MIN_ZOOM, MAX_ZOOM);
    camera.setZoom(this.targetZoom);

    // Center camera on the city active bounds
    const bounds = this.cityState.activeBounds || {
      minX: 0, maxX: this.cityState.gridSize, minY: 0, maxY: this.cityState.gridSize
    }
    const centerIso = this.cartToIso(
      bounds.minX + (bounds.maxX - bounds.minX) / 2,
      bounds.minY + (bounds.maxY - bounds.minY) / 2
    )
    camera.centerOn(centerIso.x, centerIso.y)

    // Background color (water blue for areas outside the map)
    camera.setBackgroundColor('#3a8fd6')
  }

  private setupInput() {
    // Drag to pan
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = false
      this.dragStartX = pointer.x
      this.dragStartY = pointer.y
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return

      const dx = pointer.x - pointer.prevPosition.x
      const dy = pointer.y - pointer.prevPosition.y

      // Consider it a drag if moved more than 5 pixels
      const totalDx = pointer.x - this.dragStartX
      const totalDy = pointer.y - this.dragStartY
      if (Math.abs(totalDx) > 5 || Math.abs(totalDy) > 5) {
        this.isDragging = true
      }

      this.cameras.main.scrollX -= dx / this.cameras.main.zoom
      this.cameras.main.scrollY -= dy / this.cameras.main.zoom
    })

    // Wheel to zoom
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
      const camera = this.cameras.main
      // Trackpads send continuous small deltas, standard mice send larger discrete deltas (e.g. 100)
      const zoomDelta = -deltaY * 0.001;
      this.targetZoom = Phaser.Math.Clamp(this.targetZoom + zoomDelta, MIN_ZOOM, MAX_ZOOM);
    })
  }

  // ─── Public Methods (called from React bridge) ─────────────────────

  private triggerBuildingGeneration(building: BuildingData, sprite: Phaser.GameObjects.Image, targetKey: string) {
    // Show upgrading text
    const text = this.add.text(sprite.x, sprite.y - 80, building.level > 1 ? "Upgrading..." : "Building...", {
      fontFamily: "Arial, sans-serif",
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(sprite.depth + 1).setVisible(false)

    // Animate text
    this.tweens.add({
      targets: text,
      y: text.y - 20,
      alpha: 0.8,
      yoyo: true,
      repeat: -1,
      duration: 800
    })

    // Show only on hover
    sprite.on('pointerover', () => { text.setVisible(true) })
    sprite.on('pointerout', () => { text.setVisible(false) })

    // Fire API
    fetch("/api/generate-building", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cause: building.cause,
        level: building.level,
        currentLevel: building.level > 1 ? building.level - 1 : 0
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.assetUrl) {
        // Dynamically load the new texture!
        this.load.image(targetKey, data.assetUrl)
        this.load.once(`filecomplete-image-${targetKey}`, () => {
          sprite.setTexture(targetKey)
          sprite.setAlpha(1)
          text.destroy()
        })
        this.load.start()
      } else {
        text.setText("Generation Failed")
      }
    })
    .catch(err => {
      console.error(err)
      text.setText("Error")
    })
  }
  public addBuilding(data: BuildingData) {
    // Remove existing sprite if upgrading
    const existing = this.buildingSprites.get(data.campaignSlug)
    if (existing) {
      existing.destroy()
      this.buildingSprites.delete(data.campaignSlug)
    }
    this.createBuildingSprite(data, true)
  }

  
  override update(time: number, delta: number) {
    // Smooth camera zooming
    if (this.targetZoom) {
      const camera = this.cameras.main;
      const diff = this.targetZoom - camera.zoom;
      if (Math.abs(diff) > 0.001) {
        camera.setZoom(camera.zoom + diff * 0.15); // Smooth interpolation factor
      } else if (camera.zoom !== this.targetZoom) {
        camera.setZoom(this.targetZoom);
      }
    }
  }

  
  public applyZoomDelta(delta: number) {
    this.targetZoom = Phaser.Math.Clamp(this.targetZoom + delta, MIN_ZOOM, MAX_ZOOM);
  }

  public updateBuilding(data: BuildingData) {
    this.addBuilding(data) // Re-create with animation
  }

  public resetCamera() {
    const worldBounds = this.getWorldBounds()
    this.setupCamera(worldBounds)
  }
}
