'use client'

import { useEffect } from 'react'
import { useCityStore } from '@/stores/useCityStore'
import type { ServerCityData } from '@/game/types/cityTypes'
import PhaserWrapper from '@/components/game/PhaserWrapper'

interface CityViewProps {
  serverData: ServerCityData
}

export default function CityView({ serverData }: CityViewProps) {
  const initializeCity = useCityStore(state => state.initializeCity)

  useEffect(() => {
    initializeCity(serverData)
  }, [serverData, initializeCity])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-950">
      <PhaserWrapper />
    </div>
  )
}
