'use client'

import { useEffect, useRef, useCallback } from 'react'
import Phaser from 'phaser'
import BootScene from '@/game/scenes/BootScene'
import CityScene from '@/game/scenes/CityScene'
import { useCityStore } from '@/stores/useCityStore'
import type { BuildingData, CityState } from '@/game/types/cityTypes'

export default function PhaserGame() {
  const gameContainer = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const cityState = useCityStore(state => state.cityState)
  const selectBuilding = useCityStore(state => state.selectBuilding)
  const setPhaserScene = useCityStore(state => state._setPhaserScene)

  const handleBuildingClicked = useCallback((building: BuildingData) => {
    selectBuilding(building)
  }, [selectBuilding])

  useEffect(() => {
    if (!gameContainer.current || !cityState) return
    // Don't recreate if game already exists
    if (gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainer.current,
      width: window.innerWidth,
      height: window.innerHeight,
      scene: [BootScene, CityScene],
      backgroundColor: '#3a8fd6',
      antialias: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: {
        mouse: {
          preventDefaultWheel: false,
        },
      },
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    // Store the city state in registry so BootScene can pass it to CityScene
    game.registry.set('cityState', cityState)

    // Wait for CityScene to be ready, then wire up events
    const checkScene = () => {
      const scene = game.scene.getScene('CityScene') as CityScene | null
      if (scene?.sys?.isActive()) {
        scene.events.on('building-clicked', handleBuildingClicked)
        setPhaserScene(scene)
      } else {
        // Scene not ready yet, check again
        setTimeout(checkScene, 200)
      }
    }

    // Start checking after a brief delay for BootScene to load assets
    setTimeout(checkScene, 500)

    return () => {
      if (gameRef.current) {
        const scene = gameRef.current.scene.getScene('CityScene') as CityScene | null
        if (scene && scene.events) {
          scene.events.off('building-clicked', handleBuildingClicked)
        }
        gameRef.current.destroy(true)
        gameRef.current = null
        setPhaserScene(null)
      }
    }
  }, [cityState, handleBuildingClicked, setPhaserScene])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle input blocking when modals are open
  const activeModal = useCityStore(state => state.activeModal)
  const showBuildingModal = useCityStore(state => state.showBuildingModal)

  useEffect(() => {
    if (gameRef.current) {
      if (activeModal !== null || showBuildingModal) {
        gameRef.current.input.enabled = false
      } else {
        gameRef.current.input.enabled = true
      }
    }
  }, [activeModal, showBuildingModal])

  if (!cityState) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-white text-xl font-bold animate-pulse">
          Loading your city...
        </div>
      </div>
    )
  }

  return (
    <div
      ref={gameContainer}
      className="w-screen h-screen fixed inset-0"
      style={{ touchAction: 'none' }}
    />
  )
}
